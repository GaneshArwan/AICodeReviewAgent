import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { getOctokit, getPRDiff, parseDiffIntoChunks } from "./tools";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { analyzeChunkPrompt, securityCheckPrompt, synthesizePrompt, FindingsSchema, SecurityCheckSchema, VerdictSchema } from "../prompts";
import pLimit from "p-limit";

export type LLMProvider = 'openai' | 'anthropic' | 'gemini' | 'local';

// LangGraph State Definition
export const ReviewStateAnnotation = Annotation.Root({
  prOwner: Annotation<string>(),
  prRepo: Annotation<string>(),
  prNumber: Annotation<number>(),
  githubToken: Annotation<string>(),
  llmProvider: Annotation<LLMProvider>(),
  llmApiKey: Annotation<string>(),
  llmModel: Annotation<string>(),
  diffContent: Annotation<string>(),
  fileChunks: Annotation<Array<{ filePath: string; patch: string }>>({
    reducer: (curr, next) => next,
  }),
  analyses: Annotation<Array<{
    filePath: string;
    findings: Array<{
      lineNumber: number;
      severity: 'critical' | 'warning' | 'suggestion' | 'nitpick';
      message: string;
    }>;
  }>>({
    reducer: (curr, next) => curr.concat(next),
  }),
  securityFindings: Annotation<Array<string>>({
    reducer: (curr, next) => curr.concat(next),
  }),
  verdict: Annotation<'Approve' | 'Request Changes' | 'Comment'>(),
  verdictReasoning: Annotation<string>(),
});

// LLM Factory for BYOK
function getLLM(provider: LLMProvider, apiKey: string, customModel?: string) {
  if (!customModel) {
    throw new Error("A specific model name is required.");
  }
  
  const cleanKey = apiKey.trim();
  const temperature = 0.1;

  switch (provider) {
    case 'anthropic':
      return new ChatAnthropic({
        apiKey: (cleanKey === "none" || !cleanKey) ? (process.env.ANTHROPIC_API_KEY || "") : cleanKey,
        model: customModel,
        temperature,
      });
    case 'gemini':
      return new ChatGoogleGenerativeAI({
        apiKey: (cleanKey === "none" || !cleanKey) ? (process.env.GOOGLE_GENAI_API_KEY || "") : cleanKey,
        model: customModel,
        temperature,
      });
    case 'local':
      return new ChatOpenAI({
        apiKey: "not-needed",
        configuration: {
          baseURL: process.env.LOCAL_LLM_URL || "http://localhost:11434/v1",
        },
        model: customModel,
        temperature,
      });
    case 'openai':
    default:
      return new ChatOpenAI({
        apiKey: (cleanKey === "none" || !cleanKey) ? (process.env.OPENAI_API_KEY || "") : cleanKey,
        model: customModel,
        temperature,
      });
  }
}

async function fetch_pr(state: typeof ReviewStateAnnotation.State) {
  const octokit = getOctokit(state.githubToken);
  const diffContent = await getPRDiff(octokit, state.prOwner, state.prRepo, state.prNumber);
  
  const chunks = parseDiffIntoChunks(diffContent);
  return {
    diffContent,
    fileChunks: chunks,
  };
}

async function analyze_chunks(state: typeof ReviewStateAnnotation.State) {
  const llm = getLLM(state.llmProvider, state.llmApiKey, state.llmModel);
  const structuredLlm = llm.withStructuredOutput(FindingsSchema);
  const limit = pLimit(5);
  
  const analyses = await Promise.all(
    state.fileChunks.map((chunk) => limit(async () => {
      const messages = [
        new SystemMessage(analyzeChunkPrompt),
        new HumanMessage(`File: ${chunk.filePath}\n\n<untrusted_code_diff>\n${chunk.patch}\n</untrusted_code_diff>`)
      ];
      try {
        const response = await structuredLlm.invoke(messages);
        return { filePath: chunk.filePath, findings: response.findings || [] };
      } catch (e) {
        console.error(`Analysis failed for ${chunk.filePath}:`, e);
        return { filePath: chunk.filePath, findings: [] };
      }
    }))
  );
  return { analyses };
}

async function security_check(state: typeof ReviewStateAnnotation.State) {
  const llm = getLLM(state.llmProvider, state.llmApiKey, state.llmModel);
  const limit = pLimit(5);
  
  const results = await Promise.all(
    state.fileChunks.map((chunk) => limit(async () => {
      const messages = [
        new SystemMessage(securityCheckPrompt),
        new HumanMessage(`File: ${chunk.filePath}\n\n<untrusted_code_diff>\n${chunk.patch}\n</untrusted_code_diff>`)
      ];
      try {
        // Try structured output first
        const structuredLlm = llm.withStructuredOutput(SecurityCheckSchema);
        const response = await structuredLlm.invoke(messages);
        return response.securityFindings || [];
      } catch (e: unknown) {
        console.warn(`Structured security check failed for ${chunk.filePath}, falling back:`, e instanceof Error ? e.message : String(e));
        const response = await llm.invoke(messages);
        return [response.content.toString()];
      }
    }))
  );
  
  const securityFindings = results.flat();
  
  if (securityFindings.length === 0) {
    return { securityFindings: ["No critical security issues found."] };
  }
  
  return { securityFindings };
}

async function synthesize(state: typeof ReviewStateAnnotation.State) {
  const llm = getLLM(state.llmProvider, state.llmApiKey, state.llmModel);
  
  const messages = [
    new SystemMessage(synthesizePrompt),
    new HumanMessage(`Analyses: ${JSON.stringify(state.analyses)}\nSecurity: ${JSON.stringify(state.securityFindings)}`)
  ];
  
  try {
    // Try structured output first
    const structuredLlm = llm.withStructuredOutput(VerdictSchema);
    const response = await structuredLlm.invoke(messages);
    return {
      verdict: response.verdict,
      verdictReasoning: response.verdictReasoning,
    };
  } catch (e: unknown) {
    console.warn("Structured synthesis failed, falling back to manual extraction:", e instanceof Error ? e.message : String(e));
    
    // Fallback: Manual extraction from standard response
    const response = await llm.invoke(messages);
    const content = response.content.toString();
    
    let verdict: 'Approve' | 'Request Changes' | 'Comment' = 'Comment';
    if (content.toLowerCase().includes("request changes")) verdict = "Request Changes";
    else if (content.toLowerCase().includes("approve")) verdict = "Approve";

    return {
      verdict,
      verdictReasoning: content,
    };
  }
}

// Build Graph
const workflow = new StateGraph(ReviewStateAnnotation)
  .addNode("fetch_pr", fetch_pr)
  .addNode("analyze_chunks", analyze_chunks)
  .addNode("security_check", security_check)
  .addNode("synthesize", synthesize)
  .addEdge(START, "fetch_pr")
  .addEdge("fetch_pr", "analyze_chunks")
  .addEdge("analyze_chunks", "security_check")
  .addEdge("security_check", "synthesize")
  .addEdge("synthesize", END);

export const compileGraph = () => workflow.compile();
