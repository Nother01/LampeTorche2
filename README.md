# Playlist YouTube Downloader

Ce projet permet de télécharger les titres d'une playlist Spotify depuis YouTube au format MP3.

## Configuration

Avant d'exécuter le programme, assurez-vous de configurer les variables d'environnement nécessaires dans un fichier `.env`. Créez un fichier `.env` à la racine du projet et définissez les valeurs suivantes :

USERNAME=username
PASSWORD=password

De plus, assurez-vous de remplir les informations suivantes dans le fichier `index.js` :

- `clientId`: l'ID client de votre application Spotify.
- `clientSecret`: le secret client de votre application Spotify.
- `redirectUri`: l'URL de redirection utilisée par Spotify après l'autorisation de l'application.

## Utilisation

Pour télécharger les titres d'une playlist Spotify, vous devez spécifier l'ID de la playlist dans le fichier `index.js`. Modifiez la variable `playlistId` pour y insérer l'ID de la playlist ciblée.

Une fois que vous avez configuré les variables d'environnement et spécifié l'ID de la playlist, exécutez le programme en exécutant la commande suivante dans votre terminal : 
node index.js ou npm start
Les titres de la playlist seront affichés dans la console, et chaque titre sera téléchargé depuis YouTube au format MP3.

Assurez-vous d'avoir une connexion Internet active et que les dépendances nécessaires sont installées avant d'exécuter le programme.

## Dependance

- `spotify-web-api-node` : permet d'interagir avec l'API Spotify.
- `express` : un framework web utilisé pour créer un serveur local d'authentification.
- `puppeteer` : un outil de contrôle de navigateur headless utilisé pour effectuer des recherches sur YouTube.
- `fluent-ffmpeg` : un module pour exécuter les commandes FFmpeg.

N'oubliez pas d'installer les dépendances en exécutant la commande suivante dans votre terminal :
npm install

Ainsi que le binaire du projet:
https://github.com/yt-dlp/yt-dlp

---

Si vous rencontrez des problèmes ou avez des questions, n'hésitez pas à me contacter.

Enjoy your music!

![alt text](https://imgur.com/kxmCD2pl.png)



