# Botcast
Un bot Discord pour envoyer des alertes quand vous sortez un nouvel épisode

[🤖 Inviter le bot](https://discordapp.com/oauth2/authorize?client_id=601394082689974282&scope=bot&permissions=191552)

## Help
Pour executer ces commandes, utilisez `@botcast` suivit de la commande et des arguments!
Les arguments entre [] sont obligatoires, ceux entre () sont optionnels.

Invitez le bot sur votre serveur Discord, ensuite allez dans le channel où vous voulez envoyer les messages d'alertes et exécutez `@botcast here`, et ensuite ajoutez des flux avec `@botcast add le_flux`.

### here (numéro)
Définit le channel de notification où est exécuté la commande. Si un numéro est spécifié, précise ce channel pour le flux selectionné

### add [Flux RSS]
Ajoute le flux RSS à la base de donnée.

### notif [default/numéro] (true/false/@role)
Si un argument, change le paremètre de notification sur tous les podcasts (default) ou sur un podcast (numéro) à everyone (true), désactivé (false) ou sur un rôle. Si il n'y a pas d'arguments, affiche les paramètres actuels.

### list
Affiche la liste des flux enregistrés sur ce serveur

### delete [numéro]
Supprime le flux numéro [numéro]. Pour connaitre le numéro d'un flux, utilisez `@botcast list`

### forceupdate (numéro)
Oblige le bot à relancer le dernier épisode du flux spécifié en numéro. Si pas de numéro spécifié, il va relancer tous les flux

### message (message)
Permet de modifier le message apparaissant quand un épisode sort. Si pas de message spécifié, il remet le message par défaut. Le message peut contenir **%feed_title%** qui sera remplacé par le titre du podcast, **%post_title%** qui sera remplacé par le titre de la publication, ou **%post_link%** qui sera remplacé par le lien vers la publication.

### help
Affiche cette aide

## Contact
En cas de problème avec le bot, n'hésitez pas à venir pinger [@Bigaston](https://twitter.com/Bigaston)!
