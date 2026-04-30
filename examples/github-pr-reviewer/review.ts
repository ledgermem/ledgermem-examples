import "dotenv/config";
import { Octokit } from "@octokit/rest";
import { Mnemo } from "@mnemo/memory";
import { asHits, buildReviewBody, buildSearchQuery, parsePrUrl, type PrSummary } from "./lib.js";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function main(): Promise<void> {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: tsx review.ts <pr-url>");
    process.exit(2);
  }

  const dryRun = process.argv.includes("--dry-run");
  const { owner, repo, number } = parsePrUrl(url);

  const octokit = new Octokit({ auth: requireEnv("GITHUB_TOKEN") });
  const memory = new Mnemo({
    apiKey: requireEnv("GETMNEMO_API_KEY"),
    workspaceId: requireEnv("GETMNEMO_WORKSPACE_ID"),
    apiUrl: process.env.GETMNEMO_API_URL ?? "https://api.getmnemo.xyz",
  });

  console.log(`→ fetching ${owner}/${repo}#${number}…`);
  const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: number });
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: number,
    per_page: 100,
  });

  const summary: PrSummary = {
    title: pr.title,
    body: pr.body ?? "",
    author: pr.user?.login ?? "unknown",
    changedFiles: files.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
    })),
  };

  const query = buildSearchQuery(summary);
  console.log(`→ searching memory: "${query.slice(0, 80)}…"`);
  const raw = await memory.search(query, { limit: 5 });
  const hits = asHits(raw);
  console.log(`  found ${hits.length} pattern(s)`);

  const body = buildReviewBody(summary, hits);

  if (dryRun) {
    console.log("\n--- review (dry run) ---\n");
    console.log(body);
    return;
  }

  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: number,
    body,
  });
  console.log(`✓ posted comment on ${owner}/${repo}#${number}`);

  // Save this review session as a memory so future reviews benefit
  await memory.add(
    `Reviewed ${owner}/${repo}#${number} (${summary.title}). Files: ${summary.changedFiles
      .slice(0, 5)
      .map((f) => f.filename)
      .join(", ")}.`,
    {
      metadata: {
        kind: "pr-review",
        owner,
        repo,
        prNumber: number,
        author: summary.author,
        ts: new Date().toISOString(),
      },
    },
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
