import { openai } from "@ai-sdk/openai";
import { streamText, type CoreMessage } from "ai";
import { Mnemo } from "@mnemo/memory";
import { ledgerMemTools } from "@mnemo/vercel-ai";

export const runtime = "nodejs";
export const maxDuration = 30;

function getMemory(): Mnemo {
  const apiKey = process.env.GETMNEMO_API_KEY;
  const workspaceId = process.env.GETMNEMO_WORKSPACE_ID;
  if (!apiKey || !workspaceId) {
    throw new Error("GETMNEMO_API_KEY and GETMNEMO_WORKSPACE_ID are required");
  }
  return new Mnemo({
    apiKey,
    workspaceId,
    apiUrl: process.env.GETMNEMO_API_URL ?? "https://api.getmnemo.xyz",
  });
}

interface ChatBody {
  messages: CoreMessage[];
}

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as ChatBody;
  // Never trust userId from the client body — that lets any caller read or
  // write another user's memory. Resolve it from the auth header instead.
  const userId = await resolveUserId(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

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

async function resolveUserId(req: Request): Promise<string | null> {
  // Replace this with your real auth provider (NextAuth, Clerk, etc.). The
  // important rule is: derive the userId from a verified session/token, never
  // from the request body.
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;
  // Demo-only: hash the full token so two distinct tokens never collide on a
  // truncated prefix (the previous `token.slice(0, 16)` collapsed every token
  // sharing a 16-char prefix into the same userId — a memory cross-tenant
  // bug waiting to happen if anyone copy-pasted this into production).
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `user_${hex.slice(0, 32)}`;
}
