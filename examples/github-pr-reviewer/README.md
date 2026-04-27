# github-pr-reviewer

A CLI that reviews a GitHub pull request using prior review patterns recalled from LedgerMem, then posts the synthesised guidance as a PR comment.

## Prerequisites

- Node.js 20+
- A GitHub PAT with `pull_requests: write` on the target repo (`GITHUB_TOKEN`)
- LedgerMem API key + workspace id

Seed your workspace ahead of time with the team's review heuristics — for example:

> "Always validate webhook signatures before processing payloads."
> "All new endpoints must have authentication tests."
> "Database migrations should never include data backfill — keep them schema-only."

## Run

```bash
cp .env.example .env
npm install
npm run review -- https://github.com/your-org/your-repo/pull/42
```

Add `--dry-run` to preview the comment without posting:

```bash
npm run review -- https://github.com/your-org/your-repo/pull/42 --dry-run
```

After posting, the script writes a `pr-review` memory back to LedgerMem, so future review queries can build on the team's history.

## Test

```bash
npm test
```

Tests cover URL parsing, query construction, and review-body formatting — no live GitHub or LedgerMem calls.
