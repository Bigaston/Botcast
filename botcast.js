const Discord = require('discord.js');
const config = require("./config.json");
var sq = require('sqlite3');
const client = new Discord.Client();

sq.verbose();
var db = new sq.Database(__dirname + "/base.db");

client.on('ready', () => {
	console.log('Lancement du serveur');
});

client.on('message', message => {
	if(message.author.bot) return;
	if(!message.isMemberMentioned(client.user)) return;

	args = message.content.split(/[ ]+/);

	if (args[1] == "here") {
		message.delete();
		if (message.member.hasPermission('ADMINISTRATOR')) {
			db.all(`SELECT * FROM serveur WHERE serveur_id="${message.guild.id}"`, function(err, rows) {
				if (rows.length != 0) {
					db.run(`UPDATE serveur SET channel="${message.channel.id}" WHERE serveur_id="${message.guild.id}"`)
					message.channel.send(":satellite: Le channel d'annonce a été définit ici, dans le channel **" + message.channel.name + "**")
					//	.catch(message.author.send(":warning: Je n'ai pas les permissions d'écrire dans le channel **" + message.channel.name + "**"));
				} else {
					db.run(`INSERT INTO serveur (serveur_id, channel) VALUES ("${message.guild.id}", "${message.channel.id}")`)
					message.channel.send(":satellite: Le channel d'annonce a été définit ici, dans le channel **" + message.channel.name + "**")
					//	.catch(message.author.send(":warning: Je n'ai pas les permissions d'écrire dans le channel **" + message.channel.name + "**"));	
				}
			})
		} else {
			message.author.send(":no_entry: Désolé " + message.author.username + " mais tu n'as pas les droits d'administration dans **" + message.guild.name + "**");
		}
	}

	if (args[1] == "add") {
		message.delete();
		if (message.member.hasPermission('ADMINISTRATOR')) {
			db.all(`SELECT * FROM serveur WHERE serveur_id="${message.guild.id}"`, function(err, rows) {
				if (rows.length != 0) {
					if (args.length <= 2) {
						message.channel.send(":warning: Il faut spécifier l'URL du flux RSS après la commande! Exemple : `@Botcast add http://example.com/rss`")
						return;
					}
					db.all(`SELECT * FROM podcast WHERE serveur_id="${message.guild.id}" AND feed_url="${args[2]}"`, function(err, rows) {
						if (rows.length == 0) {
							db.run(`INSERT INTO podcast (serveur_id, feed_url) VALUES ("${message.guild.id}", "${args[2]}")`)
						}
					})
				} else {
					message.author.send(":warning: Merci de commencer par définir le channel pour recevoir les actualités sur les podcasts avec la commande `here`!")
				}
			})
		} else {
			message.author.send(":no_entry: Désolé " + message.author.username + " mais tu n'as pas les droits d'administration dans **" + message.guild.name + "**");
		}
	}
});
  
client.login(config.token);