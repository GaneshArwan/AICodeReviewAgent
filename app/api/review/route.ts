import { NextRequest, NextResponse } from "next/server";
import { compileGraph, LLMProvider } from "@/lib/agent/graph";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const reviewSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  prNumber: z.union([z.string(), z.number()]).transform(v => Number(v)),
  llmProvider: z.enum(["openai", "anthropic", "gemini", "local"]),
  llmApiKey: z.string().optional(),
  llmModel: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = session.accessToken;

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!rateLimit(`review_${ip}`, 5, 60000)) {
      return NextResponse.json({ error: "Too many review requests. Please wait a minute." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input parameters", details: parsed.error.format() }, { status: 400 });
    }
    const { owner, repo, prNumber, llmProvider, llmApiKey, llmModel } = parsed.data; 

    const workflow = compileGraph();

    // Execute the LangGraph workflow
    const initialState = {
      prOwner: owner,
      prRepo: repo,
      prNumber: Number(prNumber),
      githubToken: token as string,
      llmProvider: llmProvider as LLMProvider,
      llmApiKey: llmApiKey || "none", // Some providers might use env keys
      llmModel: llmModel || "",
      diffContent: "",
      fileChunks: [],
      analyses: [],
      securityFindings: [],
      verdict: "Comment" as const,
      verdictReasoning: ""
    };

    const result = await workflow.invoke(initialState);

    return NextResponse.json({
      verdict: result.verdict,
      reasoning: result.verdictReasoning,
      analyses: result.analyses,
      securityFindings: result.securityFindings
    });
    } catch (error: unknown) {
    console.error("--- Workflow Execution Error ---");
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    console.error("--------------------------------");

    // Provide a descriptive error to the frontend
    const errorMessage = err.message?.includes("API_KEY_INVALID") 
      ? "Invalid LLM API Key. Please check your credentials in the sidebar."
      : err.message || "An unexpected error occurred during the review.";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
    }
