const Discord = require('discord.js');
const config = require("./config.json");
var sq = require('sqlite3');
var Parser = require('rss-parser');
const client = new Discord.Client();
const package = require("./package.json")

parser = new Parser();

sq.verbose();

var db = new sq.Database(__dirname + "/base.db");

client.on('ready', () => {
	console.log('Lancement du serveur');
	checkRSS()
	setInterval(checkRSS, 300000)
	client.user.setActivity("V" + package.version)
});


function checkRSS() {
	db.each("SELECT * FROM podcast", function(err, row) {
		parser.parseURL(row.feed_url, function(err, feed) {
			if (err) {
				client.users.get("136747654871777280").send(`:x: __**Erreur :**__ Le flux RSS ${row.feed_url} n'est pas trouvé. \n\`\`\`${err}\n\`\`\``)
			} else {
				feed.items = feed.items.sort(sortItems);
				
				if (row.last_guid == "" || feed.items[0].guid != row.last_guid) {
					db.run("UPDATE podcast SET last_guid='" + feed.items[0].guid + "' WHERE feed_url='" + row.feed_url + "' AND serveur_id='" + row.serveur_id + "'")
					sendMessage(row, feed)
				}
			}
		})
	})
}

function sortItems(a, b) {
	let date_a = new Date(a.isoDate);
	let date_b = new Date(b.isoDate);

	if (date_a < date_b ) {
		return 1;
	} else if (date_a > date_b) {
		return -1;
	} else {
		return 0
	}
}

function sendMessage(row_podcast, feed) {
	db.all(`SELECT * FROM serveur WHERE serveur_id="${row_podcast.serveur_id}"`, function(err, rows) {
		if (row_podcast.channel != 0) {
			chan = client.channels.get(row_podcast.channel);

			if (chan == undefined) {
				chan = client.channels.get(rows[0].default_channel)			
			}
		} else {
			chan = client.channels.get(rows[0].default_channel)
		}

		if (chan == undefined) {
			client.users.get("136747654871777280").send(":x: Le channel n'existe pas pour " + row_podcast.feed_url + " dans **" + client.guilds.get(row_podcast.serveur_id).name + "**")
			return;
		}

		desc = ""
		author = "Nobody"

		if (feed.items[0].itunes.author != undefined) {
			author = feed.items[0].itunes.author
		} else if (feed.itunes.author != undefined) {
			author = feed.itunes.author
		}

		let origin_desc = "";

		if (!!feed.items[0].contentSnippet) {
			origin_desc = feed.items[0].contentSnippet
		} else if (feed.items[0].itunes != undefined && !!feed.items[0].itunes.summary) {
			origin_desc = feed.items[0].itunes.summary
		}

		if (origin_desc > 280) {
			desc = desc + origin_desc.substring(0, 280) + " [...]"
		} else {
			desc = desc + origin_desc
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
				"value": author,
				"inline": true
			  },
			  {
				"name": "Fichier audio",
				"value": "[Ecouter](" + feed.items[0].enclosure.url + ")",
				"inline": true
			  }
			]
		  };

		if (rows[0].default_message == undefined || rows[0].default_message == "") {
			mess = ":tada: Un nouvel épisode de **%feed_title%** est sorti!"
		} else {
			mess = rows[0].default_message
		}

		mess = mess.replace("%feed_title%", feed.title).replace("%post_title%", feed.items[0].title).replace("%post_link%", feed.items[0].link)

		if (row_podcast.notif == 1) {
			chan.send("@everyone " + mess)
		} else if (row_podcast.notif != 0) {
			chan.send(`<@&${row_podcast.notif}> ` + mess)
		} else if (rows[0].default_notif == 1) {
			chan.send("@everyone " + mess)
		} else if (rows[0].default_notif != 0) {
			chan.send(`<@&${rows[0].default_notif}> ` + mess)
		} else {
			chan.send(mess)
		}
		
		chan.send({embed})
	})
}

client.on('message', message => {
	if(message.author.bot) return;
	if(!message.isMemberMentioned(client.user)) return;

	args = message.content.split(/[ ]+/);

	if (args[1] == "here") {
		message.delete();

		if (args.length == 2) {
			if (message.member.hasPermission('ADMINISTRATOR')) {
				db.all(`SELECT * FROM serveur WHERE serveur_id="${message.guild.id}"`, function(err, rows) {
					if (rows.length != 0) {
						db.run(`UPDATE serveur SET default_channel="${message.channel.id}" WHERE serveur_id="${message.guild.id}"`)
						message.channel.send(":satellite: Le channel d'annonce par défaut a été définit ici, dans le channel **" + message.channel.name + "**")
						//	.catch(message.author.send(":warning: Je n'ai pas les permissions d'écrire dans le channel **" + message.channel.name + "**"));
					} else {
						db.run(`INSERT INTO serveur (serveur_id, default_channel, default_notif) VALUES ("${message.guild.id}", "${message.channel.id}", 0)`)
						message.channel.send(":satellite: Le channel d'annonce par défaut a été définit ici, dans le channel **" + message.channel.name + "**")
						//	.catch(message.author.send(":warning: Je n'ai pas les permissions d'écrire dans le channel **" + message.channel.name + "**"));	
					}
				})
			} else {
				message.author.send(":no_entry: Désolé " + message.author.username + " mais tu n'as pas les droits d'administration dans **" + message.guild.name + "**");
			}
		} else {
			db.all(`SELECT * FROM podcast WHERE serveur_id="${message.guild.id}"`, function(err, rows) {
				if (args[2] >= rows.length) {
					message.channel.send(":warning: Vous essayez de modifier le flux numéro **" + args[2] + "** mais les numéros vont seulement jusqu'à **" + rows.length-1 + "**! Utilisez `@botcast list` pour voir les numéros!")
				} else if (args[2] < 0 ) {
					message.channel.send(":warning: Les numéros de flux ne vont que jusqu'à **0**! Utilisez `@botcast list` pour voir les numéros!")
				} else {
					db.run(`UPDATE podcast SET channel="${message.channel.id}" WHERE feed_url="${rows[args[2]].feed_url}" AND serveur_id="${message.guild.id}"`)
					message.channel.send(":satellite: Le channel d'annonce pour " + rows[args[2]].feed_url + " a été définit ici, dans le channel **" + message.channel.name + "**")
				}
			})
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
									db.run(`INSERT INTO podcast (serveur_id, feed_url, notif, channel) VALUES ("${message.guild.id}", "${args[2]}", "0", "0")`)
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
					message.author.send(":warning: Merci de commencer par définir le channel par défaut pour recevoir les actualités sur les podcasts avec la commande `here`!")
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
				"title": "Commandes administrateurs de Botcast",
				"description": "Pour executer ces commandes, utilisez `@botcast` suivit de la commande et des arguments!\nLes arguments entre [] sont obligatoires, ceux entre () sont optionnels.",
				"color": 16098851,
				"fields": [
					{
						"name": "here `(numéro)`",
						"value": "Définit le channel de notification où est exécuté la commande. Si un numéro est spécifié, précise ce channel pour le flux selectionné"
					},
					{
						"name": "add `[Flux RSS]`",
						"value": "Ajoute le flux RSS à la base de donnée."
					},
					{
						"name": "notif `[default/numéro]` `(true/false/@role)`",
						"value": "Si un argument, change le paremètre de notification sur tous les podcasts (default) ou sur un podcast (numéro) à everyone (true), désactivé (false) ou sur un rôle. Si il n'y a pas d'arguments, affiche les paramètres actuels."
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
						"name": "forceupdate (numéro)",
						"value": "Oblige le bot à relancer le dernier épisode du flux spécifié en numéro. Si pas de numéro spécifié, il va relancer tous les flux"
					},
					{
						"name": "message (message)",
						"value": "Permet de modifier le message apparaissant quand un épisode sort. Si pas de message spécifié, il remet le message par défaut. Le message peut contenir **%feed_title%** qui sera remplacé par le titre du podcast, **%post_title%** qui sera remplacé par le titre de la publication, ou **%post_link%** qui sera remplacé par le lien vers la publication."
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
						db.run(`DELETE FROM podcast WHERE feed_url="${rows[args[2]].feed_url}" AND serveur_id="${message.guild.id}"`)
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
						message.channel.send(`:warning: Il faut spécifier **default** ou alors un numéro de podcast!`);
						return;
					}
					
					if (args[2] == "default") {
						if (args.length <= 3) {
							if (rows[0].default_notif == 0) {
								value = "La notification par défaut est désactivée."
							} else if (rows[0].default_notif == 1) {
								value = "La notification par défaut est sur everyone."
							} else {
								value = "La notification par défaut est sur <@&" + rows[0].default_notif + "> ."
							}
							message.channel.send(":warning: " + value + " Pour modifier la valeur il faut spécifier un booléen `true/false` ou un role")
							return;
						} else {
							if (args[3].toLowerCase() == "true") {
								db.run(`UPDATE serveur SET default_notif=1 WHERE serveur_id="${message.guild.id}"`)
								message.channel.send(":white_check_mark: La notification par défaut est activée pour everyone!")
							} else if (args[3].toLowerCase() == "false") {
								db.run(`UPDATE serveur SET default_notif=0 WHERE serveur_id="${message.guild.id}"`)
								message.channel.send(":x: La notification par défaut est maintenant désactivée!")
							} else if (args[3].match(/<@&[0-9]*>/) != undefined) {
								db.run(`UPDATE serveur SET default_notif=${args[3].match(/<@&[0-9]*>/)[0].replace("<@&", "").replace(">", "")} WHERE serveur_id="${message.guild.id}"`)
								message.channel.send(":white_check_mark: La notification par défaut est activée pour " + args[3].match(/<@&[0-9]*>/)[0] +"!")								
							} else {
								message.author.send(":warning: Il faut spécifier un booléen `true/false` ou un role")
							}
						}
					} else {
						db.all(`SELECT * FROM podcast WHERE serveur_id="${message.guild.id}"`, function(err, rows) {
							if (args[2] >= rows.length) {
								message.channel.send(":warning: Vous essayez de modifier le flux numéro **" + args[2] + "** mais les numéros vont seulement jusqu'à **" + rows.length-1 + "**! Utilisez `@botcast list` pour voir les numéros!")
							} else if (args[2] < 0 ) {
								message.channel.send(":warning: Les numéros de flux ne vont que jusqu'à **0**! Utilisez `@botcast list` pour voir les numéros!")
							} else {
								if (args.length <= 3) {
									if ( rows[args[2]].notif == 0) {
										value = "La notification pour " + rows[args[2]].feed_url + " est désactivée."
									} else if (rows[args[2]].notif == 1) {
										value = "La notification pour " + rows[args[2]].feed_url + " est sur everyone."
									} else {
										value = "La notification pour " + rows[args[2]].feed_url + " est sur <@&" + rows[args[2]].notif + "> ."
									}
									message.channel.send(":warning: " + value + " Pour modifier la valeur il faut spécifier un booléen `true/false` ou un role")
									return;
								} else {
									if (args[3].toLowerCase() == "true") {
										db.run(`UPDATE podcast SET notif=1 WHERE feed_url="${rows[args[2]].feed_url}" AND serveur_id="${message.guild.id}"`)
										message.channel.send(":white_check_mark: La notification pour " + rows[args[2]].feed_url +" est maintenant sur everyone!")
									} else if (args[3].toLowerCase() == "false") {
										db.run(`UPDATE podcast SET notif=0 WHERE feed_url="${rows[args[2]].feed_url}" AND serveur_id="${message.guild.id}"`)
										message.channel.send(":x: La notification pour " + rows[args[2]].feed_url +" est maintenant désactivée!")
									} else if (args[3].match(/<@&[0-9]*>/) != undefined) {
										db.run(`UPDATE podcast SET notif=${args[3].match(/<@&[0-9]*>/)[0].replace("<@&", "").replace(">", "")} WHERE feed_url="${rows[args[2]].feed_url}" AND serveur_id="${message.guild.id}"`)
										message.channel.send(":white_check_mark: La notification pour " + rows[args[2]].feed_url + " est activée sur " + args[3].match(/<@&[0-9]*>/)[0] +"!")								
									} else {
										message.author.send(":warning: Il faut spécifier un booléen `true/false` ou un role")
									}
								}
							}
						})
					}

				} else {
					message.author.send(":warning: Merci de commencer par définir le channel pour recevoir les actualités sur les podcasts avec la commande `here`!")
				}
			})
		} else {
			message.author.send(":no_entry: Désolé " + message.author.username + " mais tu n'as pas les droits d'administration dans **" + message.guild.name + "**");
		}
	}

	if (args[1] == "forceupdate") {
		message.delete();
		if (message.member.hasPermission('ADMINISTRATOR')) {
			if (args.length != 3) {
				db.run(`UPDATE podcast SET last_guid=null WHERE serveur_id="${message.guild.id}"`)
				db.each(`SELECT * FROM podcast WHERE serveur_id="${message.guild.id}"`, function(err, row) {
					parser.parseURL(row.feed_url, function(err, feed) {
						feed.items = feed.items.sort(sortItems);

						db.run("UPDATE podcast SET last_guid='" + feed.items[0].guid + "' WHERE feed_url='" + row.feed_url + "'")
						sendMessage(row, feed)
					})
				})
			} else {
				db.all(`SELECT * FROM podcast WHERE serveur_id="${message.guild.id}"`, function(err, rows) {
					if (args[2] >= rows.length) {
						message.channel.send(":warning: Vous essayez de mettre à jour le flux numéro **" + args[2] + "** mais les numéros vont seulement jusqu'à **" + rows.length-1 + "**! Utilisez `@botcast list` pour voir les numéros!")
					} else if (args[2] < 0 ) {
						message.channel.send(":warning: Les numéros de flux ne vont que jusqu'à **0**! Utilisez `@botcast list` pour voir les numéros!")
					} else {
						db.run(`UPDATE podcast SET last_guid=null WHERE feed_url="${rows[args[2]].feed_url}" AND serveur_id="${message.guild.id}"`)
						db.each(`SELECT * FROM podcast WHERE feed_url="${rows[args[2]].feed_url}" AND serveur_id="${message.guild.id}"`, function(err, row) {
							parser.parseURL(row.feed_url, function(err, feed) {
								feed.items = feed.items.sort(sortItems);

								db.run("UPDATE podcast SET last_guid='" + feed.items[0].guid + "' WHERE feed_url='" + row.feed_url + "' AND serveur_id='" +message.guild.id + "'")
								sendMessage(row, feed)
							})
						})
					}
				})
			}
		}
	}

	if (args[1] == "message") {
		if (message.member.hasPermission('ADMINISTRATOR')) {
			db.all(`SELECT * FROM serveur WHERE serveur_id="${message.guild.id}"`, function(err, rows) {
				if (rows.length != 0) {
					if (args.length == 2) {
						db.run(`UPDATE serveur SET default_message="" WHERE serveur_id=${message.guild.id}`)
						message.channel.send(":pen_fountain: Le message d'annonce a été réinitialisé!")
					} else {
						mess = args.slice(2).join(" ")
						db.run(`UPDATE serveur SET default_message="${mess}" WHERE serveur_id=${message.guild.id}`)
						
						message.channel.send(":pen_fountain: Le message d'annonce a été modifié!\n> " + mess.replace("%feed_title%", "Exemple Titre Flux").replace("%post_title%", "Exemple Titre Publication").replace("%post_link%", "https://example.com"))
					}
				} else {
					message.author.send(":warning: Merci de commencer par définir le channel par défaut pour recevoir les actualités sur les podcasts avec la commande `here`!")
				}
			})
		} else {
			message.author.send(":no_entry: Désolé " + message.author.username + " mais tu n'as pas les droits d'administration dans **" + message.guild.name + "**");
		}
	}
});

client.login(config.token);