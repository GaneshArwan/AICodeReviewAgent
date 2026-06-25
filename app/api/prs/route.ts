import "@/lib/bootstrap"; // fail-fast env validation (Rule 1)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { Octokit } from "@octokit/rest";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const ownerRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const repoRegex = /^[a-zA-Z0-9._-]+$/;

const prQuerySchema = z.object({
  owner: z.string().min(1).regex(ownerRegex, "Invalid owner format"),
  repo: z.string().min(1).regex(repoRegex, "Invalid repo format"),
  page: z.coerce.number().min(1).default(1),
  search: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  sort: z.string().default("updated"),
  order: z.enum(["asc", "desc"]).default("desc")
});

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!rateLimit(`prs_${ip}`, 20, 60000)) {
      return NextResponse.json({ error: "Too many requests to fetch PRs. Please wait a minute." }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const parsed = prQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input parameters", details: parsed.error.format() }, { status: 400 });
    }
    
    const { owner, repo, page, search, startDate, endDate, sort, order } = parsed.data;
    const sortParam = sort;

    const session = await getServerSession(authOptions);
    const token = session?.accessToken;

    const octokit = token ? new Octokit({ auth: token }) : new Octokit();
    
    // Using Search API to support both searching and getting total counts for pagination
    const perPage = 10;
    let query = `repo:${owner}/${repo} is:pr is:open ${search}`;
    
    if (startDate && endDate) {
      query += ` created:${startDate}..${endDate}`;
    } else if (startDate) {
      query += ` created:>=${startDate}`;
    } else if (endDate) {
      query += ` created:<=${endDate}`;
    }
    
    const response = await octokit.search.issuesAndPullRequests({
      q: query,
      per_page: perPage,
      page,
      sort: sortParam === "relevance" ? undefined : sortParam as "comments" | "reactions" | "interactions" | "created" | "updated",
      order: order
    });

    const totalCount = response.data.total_count;
    const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

    const prs = response.data.items.map((pr) => ({
      number: pr.number,
      title: pr.title,
      author: pr.user?.login || "unknown",
      time: new Date(pr.created_at).toLocaleDateString(),
      url: pr.html_url
    }));

    return NextResponse.json({ prs, totalPages, totalCount });
  } catch (error: unknown) {
    console.error("Fetch PRs Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
