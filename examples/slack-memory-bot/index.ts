import "dotenv/config";
import pkg from "@slack/bolt";
import { LedgerMem } from "@ledgermem/memory";

const { App, LogLevel } = pkg;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const memory = new LedgerMem({
  apiKey: requireEnv("LEDGERMEM_API_KEY"),
  workspaceId: requireEnv("LEDGERMEM_WORKSPACE_ID"),
  apiUrl: process.env.LEDGERMEM_API_URL ?? "https://api.proofly.dev",
});

const app = new App({
  token: requireEnv("SLACK_BOT_TOKEN"),
  appToken: requireEnv("SLACK_APP_TOKEN"),
  signingSecret: requireEnv("SLACK_SIGNING_SECRET"),
  socketMode: true,
  logLevel: LogLevel.INFO,
});

interface MemoryHit {
  content?: string;
  text?: string;
  score?: number;
}

app.command("/remember", async ({ command, ack, respond }) => {
  await ack();
  const text = command.text.trim();
  if (!text) {
    await respond({ response_type: "ephemeral", text: "Usage: `/remember <fact to save>`" });
    return;
  }
  await memory.add(text, {
    metadata: {
      source: "slack",
      userId: command.user_id,
      username: command.user_name,
      teamId: command.team_id,
      channelId: command.channel_id,
      ts: new Date().toISOString(),
    },
  });
  await respond({ response_type: "ephemeral", text: `:white_check_mark: Remembered: _${text}_` });
});

app.command("/recall", async ({ command, ack, respond }) => {
  await ack();
  const query = command.text.trim();
  if (!query) {
    await respond({ response_type: "ephemeral", text: "Usage: `/recall <search query>`" });
    return;
  }
  const raw = await memory.search(query, { limit: 5 });
  const items: MemoryHit[] = Array.isArray(raw)
    ? (raw as MemoryHit[])
    : ((raw as { results?: MemoryHit[] })?.results ?? []);

  if (items.length === 0) {
    await respond({ response_type: "ephemeral", text: `No memories matched "${query}".` });
    return;
  }

  const lines = items.map((m, i) => {
    const content = m.content ?? m.text ?? "";
    const score = typeof m.score === "number" ? ` _(score ${m.score.toFixed(2)})_` : "";
    return `${i + 1}. ${content}${score}`;
  });

  // Slack's mrkdwn parses `<!channel>` and angle brackets as control
  // sequences — escape `<`, `>`, `&` in the user-provided query so a recall
  // search for "<!channel>" can't @-mention the whole channel.
  const safeQuery = query.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  await respond({
    response_type: "ephemeral",
    text: `*Top matches for "${safeQuery}":*\n${lines.join("\n")}`,
  });
});

async function main(): Promise<void> {
  await app.start();
  console.log("⚡️ Slack bot running (Socket Mode)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
