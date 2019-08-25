const Discord = require('discord.js');
const config = require("./config.json");
var sq = require('sqlite3');
var Parser = require('rss-parser');
const client = new Discord.Client();

sq.verbose();

if (config.is_dev) {
	var db = new sq.Database(__dirname + "/baseDev.db");	
} else {
	var db = new sq.Database(__dirname + "/base.db");
}

client.on('ready', () => {
	console.log('Lancement du serveur');
	checkRSS()
	setInterval(checkRSS, 300000)
	client.user.setActivity("vérifier quelques flux RSS")
});


function checkRSS() {
	db.each("SELECT * FROM podcast", function(err, row) {
		parser = new Parser();
		parser.parseURL(row.feed_url, function(err, feed) {

			if (row.last_guid == "" || feed.items[0].guid != row.last_guid) {
				db.run("UPDATE podcast SET last_guid='" + feed.items[0].guid + "' WHERE feed_url='" + row.feed_url + "'")
				sendMessage(row, feed)
			}
		})
	})
}

function sendMessage(row_podcast, feed) {
	db.all(`SELECT * FROM serveur WHERE serveur_id="${row_podcast.serveur_id}"`, function(err, rows) {
		if (rows[0].type == "serveur") {
			chan = client.channels.get(rows[0].channel);
		} else {
			chan = client.users.get(rows[0].channel)
		}

		if (feed.items[0].contentSnippet.length > 280) {
			desc = feed.items[0].contentSnippet.substring(0, 280) + " [...]"
		} else {
			desc = feed.items[0].contentSnippet
		}

		const embed = {
			"content" : "@everyone :tada: Un épisode vient de sortir!",
			"author": {
				"name": feed.items[0].title,
				"url": feed.items[0].link
			  },
			"description": feed.title,
			"color": 16098851,
			"timestamp": feed.items[0].isoDate,
			"footer": {
			  "text": "Botcast"
			},
			"thumbnail": {
			  "url": feed.items[0].itunes.image
			},
			"fields": [
			  {
				"name": "Description",
				"value": desc
			  },
			  {
				"name": "Posté par",
				"value": feed.items[0].itunes.author,
				"inline": true
			  },
			  {
				"name": "Fichier audio",
				"value": "[Ecouter](" + feed.items[0].enclosure.url + ")",
				"inline": true
			  }
			]
		  };

		if (rows[0].notif_everyone == 1) {
			chan.send("@everyone :tada: Un nouvel épisode de **" + feed.title + "** est sortit!")
		}
		
		chan.send({embed})
	})
}

client.on('message', message => {
	if(message.author.bot) return;
	if(!message.isMemberMentioned(client.user)) return;

	args = message.content.split(/[ ]+/);

	if (message.channel.type == "text") {
		if (args[1] == "here") {
			message.delete();
			if (message.member.hasPermission('ADMINISTRATOR')) {
				db.all(`SELECT * FROM serveur WHERE serveur_id="${message.guild.id}"`, function(err, rows) {
					if (rows.length != 0) {
						db.run(`UPDATE serveur SET channel="${message.channel.id}" WHERE serveur_id="${message.guild.id}"`)
						message.channel.send(":satellite: Le channel d'annonce a été définit ici, dans le channel **" + message.channel.name + "**")
						//	.catch(message.author.send(":warning: Je n'ai pas les permissions d'écrire dans le channel **" + message.channel.name + "**"));
					} else {
						db.run(`INSERT INTO serveur (serveur_id, channel, type, notif_everyone) VALUES ("${message.guild.id}", "${message.channel.id}", "serveur", 0)`)
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
								var parser = new Parser();
								parser.parseURL(args[2], function(err, feed) {
									if (feed != undefined) {
										db.run(`INSERT INTO podcast (serveur_id, feed_url) VALUES ("${message.guild.id}", "${args[2]}")`)
										message.channel.send(":tada: Le flux `" + args[2] + "` a bien été ajouté dans la base!")
									} else {
										message.channel.send(":warning: Le flux spécifié `" + args[2] + "` n'est pas un flux RSS valide!")
									}
								})
							} else {
								message.channel.send(":warning: Le flux est déjà dans la base!")
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

		if (args[1] == "help") {
			message.delete();
			if (message.member.hasPermission('ADMINISTRATOR')) {
				const embed = {
					"title": "Commades administrateurs de Botcast",
					"description": "Pour executer ces commandes, utilisez `@botcast` suivit de la commande et des arguments!\nLes arguments entre [] sont obligatoires, ceux entre () sont optionnels.",
					"color": 16098851,
					"fields": [
						{
							"name": "here",
							"value": "Définit le channel de notification où est exécuté la commande."
						},
						{
							"name": "add `[Flux RSS]`",
							"value": "Ajoute le flux RSS à la base de donnée."
						},
						{
							"name": "notif `(true/false)`",
							"value": "Si un argument, change le paremètre de notification à activé (true), ou désactivé (false). Si il n'y a pas d'arguments, affiche les paramètres actuels."
						},
						{
							"name": "list",
							"value": "Affiche la liste des flux enregistrés sur ce serveur"
						},
						{
							"name": "delete [numéro]",
							"value": "Supprime le flux numéro [numéro]. Pour connaitre le numéro d'un flux, utilisez `@botcast list`"
						},
						{
							"name": "help",
							"value": "Affiche cette aide"
						}
					]
				};

				message.channel.send({ embed })
			} else {
				message.author.send("Il n'y a pas de commandes pour les utilisateurs pour le moment!")
			}
		}

		if (args[1] == "list") {
			message.delete();
			if (message.member.hasPermission('ADMINISTRATOR')) {
				db.all(`SELECT * FROM podcast WHERE serveur_id="${message.guild.id}"`, function(err, rows) {
					if (rows.length != 0) {
						to_send = ":page_facing_up: Il y a actuellement " + rows.length + " flux enregistrés sur ce serveur."

						for(i = 0; i < rows.length; i++) {
							to_send = to_send + "\n`[" + i + "]` - " + rows[i].feed_url

							if (to_send.length > 1500 && i != rows.length-1) {
								message.channel.send(to_send)
								to_send = ""
							}
						}

						message.channel.send(to_send)
					} else {
						message.channel.send(":warning: Il n'y a actuellement pas de flux sur ce serveur! Utilisez `@botcast add [flux]` pour en ajoute!")
					}
				})
			} else {
				message.author.send(":no_entry: Désolé " + message.author.username + " mais tu n'as pas les droits d'administration dans **" + message.guild.name + "**")
			}
		}

		if (args[1] == "delete") {
			message.delete();
			if (message.member.hasPermission('ADMINISTRATOR')) {
				if (args.length != 3) {
					message.channel.send(":warning: Vous devez spécifier un numéro de flux. Pour les voir, utilisez la commande `@botcast list`")
				} else {
					db.all(`SELECT * FROM podcast WHERE serveur_id="${message.guild.id}"`, function(err, rows) {
						if (args[2] >= rows.length) {
							message.channel.send(":warning: Vous essayez de supprimer le flux numéro **" + args[2] + "** mais les numéros vont seulement jusqu'à **" + rows.length-1 + "**! Utilisez `@botcast list` pour voir les numéros!")
						} else if (args[2] < 0 ) {
							message.channel.send(":warning: Les numéros de flux ne vont que jusqu'à **0**! Utilisez `@botcast list` pour voir les numéros!")
						} else {
							db.run(`DELETE FROM podcast WHERE feed_url="${rows[args[2]].feed_url}"`)
							message.channel.send(`:fire: Le flux ${rows[args[2]].feed_url} a bien été supprimé de la base!`)
						}
					})
				}
			} else {
				message.author.send(":no_entry: Désolé " + message.author.username + " mais tu n'as pas les droits d'administration dans **" + message.guild.name + "**")
			}
		}

		if (args[1] == "notif") {
			message.delete();
			if (message.member.hasPermission('ADMINISTRATOR')) {
				db.all(`SELECT * FROM serveur WHERE serveur_id="${message.guild.id}"`, function(err, rows) {
					if (rows.length != 0) {
						if (args.length <= 2) {
							if (rows[0].notif_everyone == 0) {
								value = "La notification est désactivée."
							} else {
								value = "La notification est activée."
							}
							message.channel.send(":warning: " + value + " Pour modifier la valeur il faut spécifier un booléen `true/false`")
							return;
						} else {
							if (args[2].toLowerCase() == "true") {
								db.run(`UPDATE serveur SET notif_everyone=1 WHERE serveur_id="${message.guild.id}"`)
								message.channel.send(":white_check_mark: La notification est maintenant activée!")
							} else if (args[2].toLowerCase() == "false") {
								db.run(`UPDATE serveur SET notif_everyone=0 WHERE serveur_id="${message.guild.id}"`)
								message.channel.send(":x: La notification est maintenant désactivée!")
							} else {
								message.author.send(":warning: Il faut spécifier un booléen `true/false`")
							}
						}
					} else {
						message.author.send(":warning: Merci de commencer par définir le channel pour recevoir les actualités sur les podcasts avec la commande `here`!")
					}
				})
			} else {
				message.author.send(":no_entry: Désolé " + message.author.username + " mais tu n'as pas les droits d'administration dans **" + message.guild.name + "**");
			}
		}
	} else if (message.channel.type == "dm" ) {
		if (args[1] == "add") {
			db.all(`SELECT * FROM serveur WHERE serveur_id="${message.author.id}"`, function(err, rows) {
				if (rows.length != 0) {
					if (args.length <= 2) {
						message.channel.send(":warning: Il faut spécifier l'URL du flux RSS après la commande! Exemple : `@Botcast add http://example.com/rss`")
						return;
					}
					db.all(`SELECT * FROM podcast WHERE serveur_id="${message.author.id}" AND feed_url="${args[2]}"`, function(err, rows) {
						if (rows.length == 0) {
							var parser = new Parser();
							parser.parseURL(args[2], function(err, feed) {
								if (feed != undefined) {
									db.run(`INSERT INTO podcast (serveur_id, feed_url) VALUES ("${message.author.id}", "${args[2]}")`)
									message.channel.send(":tada: Le flux `" + args[2] + "` a bien été ajouté dans la base!")
								} else {
									message.channel.send(":warning: Le flux spécifié `" + args[2] + "` n'est pas un flux RSS valide!")
								}
							})
						} else {
							message.channel.send(":warning: Le flux est déjà dans la base!")
						}
					})
				} else {
					db.run(`INSERT INTO serveur (serveur_id, channel, type, notif_everyone) VALUES ("${message.author.id}", "${message.author.id}", "dm", 0)`)
					db.all(`SELECT * FROM podcast WHERE serveur_id="${message.author.id}" AND feed_url="${args[2]}"`, function(err, rows) {
						if (rows.length == 0) {
							var parser = new Parser();
							parser.parseURL(args[2], function(err, feed) {
								if (feed != undefined) {
									db.run(`INSERT INTO podcast (serveur_id, feed_url) VALUES ("${message.author.id}", "${args[2]}")`)
									message.channel.send(":tada: Le flux `" + args[2] + "` a bien été ajouté dans la base!")
								} else {
									message.channel.send(":warning: Le flux spécifié `" + args[2] + "` n'est pas un flux RSS valide!")
								}
							})
						} else {
							message.channel.send(":warning: Le flux est déjà dans la base!")
						}
					})
				}
			})
		}		
	}
});

if (config.is_dev) {
	client.login(config.token_dev)
} else {
	client.login(config.token);
}