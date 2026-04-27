import { openai } from "@ai-sdk/openai";
import { streamText, type CoreMessage } from "ai";
import { LedgerMem } from "@ledgermem/memory";
import { ledgerMemTools } from "@ledgermem/vercel-ai";

export const runtime = "nodejs";
export const maxDuration = 30;

function getMemory(): LedgerMem {
  const apiKey = process.env.LEDGERMEM_API_KEY;
  const workspaceId = process.env.LEDGERMEM_WORKSPACE_ID;
  if (!apiKey || !workspaceId) {
    throw new Error("LEDGERMEM_API_KEY and LEDGERMEM_WORKSPACE_ID are required");
  }
  return new LedgerMem({
    apiKey,
    workspaceId,
    apiUrl: process.env.LEDGERMEM_API_URL ?? "https://api.proofly.dev",
  });
}

interface ChatBody {
  messages: CoreMessage[];
  userId?: string;
}

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as ChatBody;
  const userId = body.userId ?? "anonymous";

  const memory = getMemory();
  const lastUserMessage = [...body.messages].reverse().find((m) => m.role === "user");
  const lastUserText =
    typeof lastUserMessage?.content === "string"
      ? lastUserMessage.content
      : Array.isArray(lastUserMessage?.content)
        ? lastUserMessage.content
            .map((p) => (typeof p === "object" && "text" in p ? String(p.text) : ""))
            .join(" ")
        : "";

  let priorContext = "";
  if (lastUserText.trim().length > 0) {
    const hits = await memory.search(lastUserText, { limit: 5 });
    const items = Array.isArray(hits)
      ? hits
      : ((hits as { results?: Array<{ content?: string; text?: string }> })?.results ?? []);
    if (items.length > 0) {
      priorContext =
        "Things you already know about this user:\n" +
        items.map((m, i) => `${i + 1}. ${m.content ?? m.text ?? ""}`).join("\n");
    }
  }

  const system = [
    "You are a helpful assistant with persistent memory.",
    "When the user shares a stable fact about themselves (preferences, name, role, ongoing project), call the `addMemory` tool to save it.",
    "Use the `searchMemory` tool to retrieve facts before answering personal questions.",
    priorContext,
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await streamText({
    model: openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
    system,
    messages: body.messages,
    tools: ledgerMemTools({ memory, userId }),
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
