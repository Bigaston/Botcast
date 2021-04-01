require("dotenv").config();
const {
  DiscordInteractions,
  ApplicationCommandOptionType,
} = require("slash-commands");

const GUILD_ID = 352919638864035881;

const interaction = new DiscordInteractions({
  applicationId: process.env.CLIENT_ID,
  authToken: process.env.TOKEN,
  publicKey: process.env.PUBLIC_KEY,
});

async function main() {
  await interaction
    .createApplicationCommand(
      {
        name: "channel",
        description:
          "Choose the channel used by Botcast for the notification globally",
        options: [
          {
            type: 7,
            name: "channel",
            description: "The channel that Botcast will use",
            default: false,
            required: true,
          },
        ],
      },
      GUILD_ID
    )
    .then(console.log)
    .catch(console.error);
}

main();
