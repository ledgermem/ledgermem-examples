# LedgerMem Examples

Runnable, end-to-end examples showing how to wire [LedgerMem](https://proofly.dev) into real applications.

Each example is a standalone npm workspace under `examples/`. Each one has its own `README.md`, `.env.example`, and a single command to run.

## Examples

| # | Slug | Stack | Difficulty | What it shows |
| - | ---- | ----- | ---------- | ------------- |
| 1 | [`quickstart-ts`](./examples/quickstart-ts) | Node 22, TypeScript | Beginner | Add three memories, search, print results. The "hello world" of LedgerMem. |
| 2 | [`nextjs-chatbot-with-memory`](./examples/nextjs-chatbot-with-memory) | Next.js 15 (App Router), React 19, Vercel AI SDK | Intermediate | Streaming chatbot that remembers the user across turns via `@ledgermem/vercel-ai` tools. |
| 3 | [`discord-bot-memory`](./examples/discord-bot-memory) | discord.js 14 | Intermediate | Discord bot with `/remember` and `/recall` slash commands. |
| 4 | [`slack-memory-bot`](./examples/slack-memory-bot) | @slack/bolt | Intermediate | Slack bot with `/remember` and `/recall` slash commands. |
| 5 | [`customer-support-rag`](./examples/customer-support-rag) | Express, TypeScript | Intermediate | Two-endpoint API: `/ingest` loads FAQs, `/ask` retrieves answers. |
| 6 | [`github-pr-reviewer`](./examples/github-pr-reviewer) | Octokit, TypeScript | Advanced | CLI that reviews a PR using prior review patterns from memory. |

## Run an example

```bash
cd examples/quickstart-ts
cp .env.example .env   # fill in your keys
npm install
npm start
```

The repo uses npm workspaces, so you can also install everything at once from the root:

```bash
npm install
npm test --workspaces --if-present
```

## Need credentials?

Sign up at [proofly.dev](https://proofly.dev) and grab an API key + workspace id. Every example expects:

```bash
LEDGERMEM_API_KEY=...
LEDGERMEM_WORKSPACE_ID=...
LEDGERMEM_API_URL=https://api.proofly.dev   # optional
```

## License

[MIT](./LICENSE)
