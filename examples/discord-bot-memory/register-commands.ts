import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const commands = [
  new SlashCommandBuilder()
    .setName("remember")
    .setDescription("Save a fact to LedgerMem")
    .addStringOption((opt) =>
      opt.setName("text").setDescription("What should I remember?").setRequired(true),
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("recall")
    .setDescription("Search saved memories")
    .addStringOption((opt) =>
      opt.setName("query").setDescription("What are you looking for?").setRequired(true),
    )
    .addIntegerOption((opt) =>
      opt.setName("limit").setDescription("Max results (default 5)").setMinValue(1).setMaxValue(25),
    )
    .toJSON(),
];

async function main(): Promise<void> {
  const token = requireEnv("DISCORD_BOT_TOKEN");
  const clientId = requireEnv("DISCORD_CLIENT_ID");
  const guildId = process.env.DISCORD_GUILD_ID;

  const rest = new REST({ version: "10" }).setToken(token);

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(`Registered ${commands.length} guild commands to ${guildId}`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`Registered ${commands.length} global commands (may take up to an hour to appear)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
