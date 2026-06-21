import { Octokit } from "@octokit/rest";
import parseDiff from "parse-diff";

export const getOctokit = (token?: string) => {
  return token && token !== "none" ? new Octokit({ auth: token }) : new Octokit();
};

export const getPRMetadata = async (octokit: Octokit, owner: string, repo: string, prNumber: number) => {
  const response = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });
  return response.data;
};

export const getPRDiff = async (octokit: Octokit, owner: string, repo: string, prNumber: number): Promise<string> => {
  // GitHub returns raw diff string when accept header requests diff
  const response = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: {
      format: "diff",
    },
  });
  return response.data as unknown as string;
};

export const parseDiffIntoChunks = (diffContent: string) => {
  const files = parseDiff(diffContent);
  return files.map((file) => {
    const filePath = file.to || file.from || "unknown";
    let patch = "";
    for (const chunk of file.chunks) {
      patch += chunk.content + "\n";
      for (const change of chunk.changes) {
        patch += change.content + "\n";
      }
    }
    return {
      filePath,
      patch,
    };
  });
};
