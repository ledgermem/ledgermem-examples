import { describe, expect, it } from "vitest";
import { asHits, buildReviewBody, buildSearchQuery, parsePrUrl } from "./lib.js";

describe("parsePrUrl", () => {
  it("parses a standard PR URL", () => {
    expect(parsePrUrl("https://github.com/getmnemo/getmnemo-cli/pull/42")).toEqual({
      owner: "getmnemo",
      repo: "getmnemo-cli",
      number: 42,
    });
  });

  it("parses a PR URL with trailing files segment", () => {
    expect(parsePrUrl("https://github.com/getmnemo/getmnemo-cli/pull/42/files")).toEqual({
      owner: "getmnemo",
      repo: "getmnemo-cli",
      number: 42,
    });
  });

  it("rejects non-PR URLs", () => {
    expect(() => parsePrUrl("https://github.com/foo/bar")).toThrow(/Invalid GitHub PR URL/);
  });
});

describe("buildSearchQuery", () => {
  it("combines title and changed file names", () => {
    const q = buildSearchQuery({
      title: "Add OAuth flow",
      body: "",
      author: "shah",
      changedFiles: [
        { filename: "src/auth.ts", status: "modified", additions: 50, deletions: 10 },
        { filename: "src/oauth.ts", status: "added", additions: 200, deletions: 0 },
      ],
    });
    expect(q).toContain("Add OAuth flow");
    expect(q).toContain("src/auth.ts");
    expect(q).toContain("src/oauth.ts");
  });
});

describe("asHits", () => {
  it("normalizes array shape", () => {
    expect(asHits([{ id: "1" }])).toEqual([{ id: "1" }]);
  });
  it("normalizes results-wrapper shape", () => {
    expect(asHits({ results: [{ id: "1" }] })).toEqual([{ id: "1" }]);
  });
  it("returns [] for unknown shapes", () => {
    expect(asHits(null)).toEqual([]);
  });
});

describe("buildReviewBody", () => {
  it("notes empty results gracefully", () => {
    const body = buildReviewBody(
      { title: "x", body: "", author: "a", changedFiles: [] },
      [],
    );
    expect(body).toMatch(/No prior review patterns/);
  });

  it("renders bullets when hits exist", () => {
    const body = buildReviewBody(
      { title: "x", body: "", author: "a", changedFiles: [] },
      [
        { content: "Always validate webhook signatures.", score: 0.92 },
        { content: "Use parameterized SQL queries.", score: 0.81 },
      ],
    );
    expect(body).toMatch(/Always validate webhook signatures/);
    expect(body).toMatch(/score 0\.92/);
    expect(body).toMatch(/Use parameterized SQL queries/);
  });
});
