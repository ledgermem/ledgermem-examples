import "dotenv/config";
import { LedgerMem } from "@ledgermem/memory";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

interface MemoryRecord {
  id?: string;
  content?: string;
  text?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

function asArray(value: unknown): MemoryRecord[] {
  if (Array.isArray(value)) return value as MemoryRecord[];
  if (value && typeof value === "object" && Array.isArray((value as { results?: unknown }).results)) {
    return (value as { results: MemoryRecord[] }).results;
  }
  return [];
}

async function main(): Promise<void> {
  const memory = new LedgerMem({
    apiKey: requireEnv("LEDGERMEM_API_KEY"),
    workspaceId: requireEnv("LEDGERMEM_WORKSPACE_ID"),
    apiUrl: process.env.LEDGERMEM_API_URL ?? "https://api.proofly.dev",
  });

  console.log("→ adding 3 memories…");
  const seeds = [
    { content: "Acme Corp prefers a navy-blue brand palette.", metadata: { kind: "brand", customer: "acme" } },
    { content: "Acme's primary contact is Jamie Chen (jamie@acme.example).", metadata: { kind: "contact", customer: "acme" } },
    { content: "Acme renewed their Pro plan on 2026-03-12 for $24,000/yr.", metadata: { kind: "billing", customer: "acme" } },
  ];

  for (const s of seeds) {
    const created = await memory.add(s.content, { metadata: s.metadata }) as MemoryRecord;
    console.log(`  ✓ ${created.id ?? "(no id)"}  ${s.content}`);
  }

  console.log("\n→ searching: 'what brand color does Acme use?'");
  const results = asArray(await memory.search("what brand color does Acme use?", { limit: 3 }));

  if (results.length === 0) {
    console.log("  (no results)");
    return;
  }

  for (const r of results) {
    const score = typeof r.score === "number" ? r.score.toFixed(3) : "—";
    console.log(`  [${score}] ${r.content ?? r.text ?? ""}`);
  }
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
