import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("quickstart-ts", () => {
  it("seeds three memories and runs a search", () => {
    const src = readFileSync(join(import.meta.dirname, "index.ts"), "utf8");
    expect(src).toMatch(/memory\.add/);
    expect(src).toMatch(/memory\.search/);
    const seedMatches = src.match(/content:\s*"/g) ?? [];
    expect(seedMatches.length).toBeGreaterThanOrEqual(3);
  });

  it("requires GETMNEMO_API_KEY at startup", () => {
    const src = readFileSync(join(import.meta.dirname, "index.ts"), "utf8");
    expect(src).toMatch(/GETMNEMO_API_KEY/);
    expect(src).toMatch(/GETMNEMO_WORKSPACE_ID/);
  });
});
