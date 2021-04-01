require("dotenv").config();
const package = require("./package.json");
const Discord = require("discord.js");
const client = new Discord.Client();

client.on("ready", () => {
  console.log("Lancement du serveur");
  client.user.setActivity("V" + package.version);
});

client.login(process.env.TOKEN);
