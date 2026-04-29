import express, { type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { Mnemo } from "@getmnemo/memory";

export interface MemoryClient {
  add(content: string, opts?: { metadata?: Record<string, unknown> }): Promise<unknown>;
  search(query: string, opts?: { limit?: number }): Promise<unknown>;
}

const ingestSchema = z.object({
  product: z.string().min(1).optional(),
  faqs: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
        url: z.string().url().optional(),
      }),
    )
    .min(1),
});

const askSchema = z.object({
  question: z.string().min(1),
  limit: z.number().int().min(1).max(20).optional(),
});

interface MemoryHit {
  id?: string;
  content?: string;
  text?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

function asArray(value: unknown): MemoryHit[] {
  if (Array.isArray(value)) return value as MemoryHit[];
  if (value && typeof value === "object" && Array.isArray((value as { results?: unknown }).results)) {
    return (value as { results: MemoryHit[] }).results;
  }
  return [];
}

export function createApp(memory: MemoryClient): express.Express {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/healthz", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/ingest", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = ingestSchema.parse(req.body);
      const written: Array<{ question: string }> = [];
      for (const faq of body.faqs) {
        const content = `Q: ${faq.question}\nA: ${faq.answer}`;
        await memory.add(content, {
          metadata: {
            kind: "faq",
            product: body.product ?? null,
            url: faq.url ?? null,
          },
        });
        written.push({ question: faq.question });
      }
      res.status(201).json({ ok: true, count: written.length, written });
    } catch (err) {
      next(err);
    }
  });

  app.post("/ask", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, limit } = askSchema.parse(req.body);
      const raw = await memory.search(question, { limit: limit ?? 5 });
      const hits = asArray(raw);
      res.json({
        ok: true,
        question,
        results: hits.map((h) => ({
          id: h.id,
          content: h.content ?? h.text ?? "",
          score: typeof h.score === "number" ? h.score : null,
          metadata: h.metadata ?? {},
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: "validation_error", issues: err.issues });
      return;
    }
    // Never echo internal error messages to the client — they can leak stack
    // frames, library internals, or upstream API responses. Log instead.
    const message = err instanceof Error ? err.message : String(err);
    console.error("unhandled error in customer-support-rag", message);
    res.status(500).json({ ok: false, error: "internal_error" });
  });

  return app;
}

export function buildMemory(): Mnemo {
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
