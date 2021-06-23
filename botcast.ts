require("dotenv").config();
const debug = require("debug")("botcast")
const packageModule = require("./package.json");
const Discord = require("discord.js");
const client = new Discord.Client();

client.on("ready", () => {
  debug("Lancement du serveur");
  client.user.setActivity("V" + packageModule.version);
});

client.login(process.env.TOKEN);
