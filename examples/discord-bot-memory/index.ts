import "dotenv/config";
import { Client, Events, GatewayIntentBits, MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { Mnemo } from "@mnemo/memory";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const memory = new Mnemo({
  apiKey: requireEnv("GETMNEMO_API_KEY"),
  workspaceId: requireEnv("GETMNEMO_WORKSPACE_ID"),
  apiUrl: process.env.GETMNEMO_API_URL ?? "https://api.getmnemo.xyz",
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
});

async function handleRemember(interaction: ChatInputCommandInteraction): Promise<void> {
  const text = interaction.options.getString("text", true);
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  await memory.add(text, {
    metadata: {
      source: "discord",
      userId: interaction.user.id,
      username: interaction.user.username,
      guildId: interaction.guildId ?? undefined,
      channelId: interaction.channelId,
      ts: new Date().toISOString(),
    },
  });
  await interaction.editReply(`Remembered: \`${text}\``);
}

interface MemoryHit {
  content?: string;
  text?: string;
  score?: number;
}

async function handleRecall(interaction: ChatInputCommandInteraction): Promise<void> {
  const query = interaction.options.getString("query", true);
  const limit = interaction.options.getInteger("limit") ?? 5;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const raw = await memory.search(query, { limit });
  const items: MemoryHit[] = Array.isArray(raw)
    ? (raw as MemoryHit[])
    : ((raw as { results?: MemoryHit[] })?.results ?? []);

  if (items.length === 0) {
    await interaction.editReply("No memories matched that query.");
    return;
  }

  const body = items
    .map((m, i) => {
      const content = m.content ?? m.text ?? "";
      const score = typeof m.score === "number" ? ` _(score ${m.score.toFixed(2)})_` : "";
      return `${i + 1}. ${content}${score}`;
    })
    .join("\n");

  await interaction.editReply(`**Top matches for "${query}":**\n${body}`);
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    if (interaction.commandName === "remember") {
      await handleRemember(interaction);
    } else if (interaction.commandName === "recall") {
      await handleRecall(interaction);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("interaction error:", message);
    // Don't echo the raw error to the channel — it can include upstream
    // URLs, API tokens, or stack frames. Surface a generic notice and rely
    // on the bot host's logs for diagnosis.
    const userMessage = "Sorry, something went wrong handling that command.";
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(userMessage);
    } else {
      await interaction.reply({ content: userMessage, flags: MessageFlags.Ephemeral });
    }
  }
});

void client.login(requireEnv("DISCORD_BOT_TOKEN"));
