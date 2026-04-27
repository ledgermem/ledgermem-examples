import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp, type MemoryClient } from "./app.js";

class FakeMemory implements MemoryClient {
  public added: Array<{ content: string; metadata?: Record<string, unknown> }> = [];
  public lastQuery?: string;

  async add(content: string, opts?: { metadata?: Record<string, unknown> }): Promise<unknown> {
    this.added.push({ content, metadata: opts?.metadata });
    return { id: `mem_${this.added.length}` };
  }

  async search(query: string): Promise<unknown> {
    this.lastQuery = query;
    return {
      results: [
        { id: "mem_1", content: "Q: How do I reset my password?\nA: Use /forgot-password.", score: 0.91 },
        { id: "mem_2", content: "Q: What plans are available?\nA: Free, Pro, Enterprise.", score: 0.71 },
      ],
    };
  }
}

describe("customer-support-rag API", () => {
  let memory: FakeMemory;

  beforeEach(() => {
    memory = new FakeMemory();
  });

  it("GET /healthz returns ok", async () => {
    const app = createApp(memory);
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("POST /ingest writes each FAQ to memory", async () => {
    const app = createApp(memory);
    const res = await request(app)
      .post("/ingest")
      .send({
        product: "Acme",
        faqs: [
          { question: "How do I reset my password?", answer: "Click forgot password." },
          { question: "Pricing?", answer: "Free, Pro, Enterprise." },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.count).toBe(2);
    expect(memory.added).toHaveLength(2);
    expect(memory.added[0]?.metadata?.kind).toBe("faq");
    expect(memory.added[0]?.metadata?.product).toBe("Acme");
  });

  it("POST /ingest rejects empty payloads", async () => {
    const app = createApp(memory);
    const res = await request(app).post("/ingest").send({ faqs: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
  });

  it("POST /ask returns search hits", async () => {
    const app = createApp(memory);
    const res = await request(app).post("/ask").send({ question: "reset password" });
    expect(res.status).toBe(200);
    expect(memory.lastQuery).toBe("reset password");
    expect(res.body.results).toHaveLength(2);
    expect(res.body.results[0].score).toBeCloseTo(0.91);
  });

  it("POST /ask rejects empty question", async () => {
    const app = createApp(memory);
    const res = await request(app).post("/ask").send({ question: "" });
    expect(res.status).toBe(400);
  });
});
