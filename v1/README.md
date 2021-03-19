# Botcast
## Un bot Discord pour envoyer des alertes quand vous sortez un nouvel épisode

Exemple d'alerte :

![Message Botcast](https://i.imgur.com/e1oUBmh.png)

### Mise en place

1. [🤖 Inviter le bot](https://discordapp.com/oauth2/authorize?client_id=601394082689974282&scope=bot&permissions=191552)
2. Allez dans le channel où vous voulez envoyer les messages d'alertes et exécutez `@botcast here`
3. Ajoutez votre premier flux avec `@botcast add http://adresse_du_flux`
4. Attendez quelques minutes et vous devriez avoir un message annonçant la sortie du dernier épisode du flux.
5. Enjoy

### Manuel d'utilisation
Pour executer ces commandes, utilisez `@botcast` suivit de la commande et des arguments! Vous pouvez aussi préfixer votre commande par `?`.
__**Exemple:**__ `@botcast list` ou `?list`
Les arguments entre [] sont obligatoires, ceux entre () sont optionnels.

#### here (numéro)
Définit le channel de notification où est exécuté la commande. Si un numéro est spécifié, précise ce channel pour le flux selectionné

```@botcast here```


#### add [Flux RSS]
Ajoute le flux RSS à la base de donnée.

```@botcast add https://robotsettondeuses.lepodcast.fr/rss```


#### notif [default/numéro] (true/false/@role)
Permet d'utiliser le système de notification @everyone ou @user pour que les personnes concernées aient une alerte.

Si un argument, change le paramètre de notification sur tous les podcasts (default) ou sur un podcast (numéro) à (true), désactivé (false) ou sur un rôle. Si il n'y a pas d'arguments, affiche les paramètres actuels.

##### Réglages globaux

Activer les notifications de tous les podcasts : ```@botcast notif default true```

Cela change le message et ajoute @everyone au début

![Message Botcast Notif](https://i.imgur.com/rXAVUrY.png)

Désactiver les notifications de tous les podcasts (réglage par défaut) : ```@botcast notif default false```

##### Réglages individuels

Afficher l'état des notifications du podcast 1 : ```@botcast notif 1``` 

Désactiver les notifications du podcast 1 : ```@botcast notif 1 false```



#### list
Affiche la liste des flux enregistrés sur ce serveur

```@botcast list``` 

#### delete [numéro]
Supprime le flux numéro [numéro]. Pour connaitre le numéro d'un flux, utilisez `@botcast list`

```@botcast delete 1``` 


#### forceupdate (numéro)
Oblige le bot à relancer le dernier épisode du flux spécifié en numéro. Si pas de numéro spécifié, il va relancer tous les flux

```@botcast forceupdate``` 

```@botcast forceupdate 1``` 


#### message (message)
Permet de modifier le message apparaissant au-dessus de l'encart de prévisualisation quand un épisode sort. 

Si pas de message spécifié, il remet le message par défaut. Le message peut contenir **%feed_title%** qui sera remplacé par le titre du podcast, **%post_title%** qui sera remplacé par le titre de la publication, ou **%post_link%** qui sera remplacé par le lien vers la publication.

Le message par défaut est :

```@botcast message :tada: Un nouvel épisode de **%feed_title%** est sorti!```

#### help
Affiche cette aide

```@botcast help``` 


### Contact
En cas de problème avec le bot, n'hésitez pas à venir pinger [@Bigaston](https://twitter.com/Bigaston)!
