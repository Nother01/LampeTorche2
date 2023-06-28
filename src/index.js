const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');
const ffmpegPath = require('ffmpeg-static').path;
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();
const app = express();

const PORT = 2222;
const clientId = '154c39de96c34e43b1b9e29fb3181263';
const clientSecret = '23272e136dc14a12bfbfd640e367efd1';
const redirectUri = `http://localhost:2222/callback`;

const playlistId = '68JWLLWCXKYJvfEWBbxTZ4?si=9b5f58cae2a54397';

const username = process.env.USERNAME;
const password = process.env.PASSWORD;

const spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUri: redirectUri,
});

const scopes = ['playlist-read-private', 'playlist-read-collaborative'];
const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'state');

const setTokens = tokens => {
    spotifyApi.setAccessToken(tokens['access_token']);
    spotifyApi.setRefreshToken(tokens['refresh_token']);
};

const refreshAccessToken = async () => {
    const data = await spotifyApi.refreshAccessToken();
    const { access_token: newAccessToken } = data.body;
    spotifyApi.setAccessToken(newAccessToken);
};

const requestAuthorizedTokens = async () => {
    const autoLogin = username.length > 0 && password.length > 0;
    const app = express();
    let resolve;
    const getCode = new Promise(_resolve => {
      resolve = _resolve;
    });
    app.get('/callback', function (req, res) {
      resolve(req.query.code);
      res.end('');
    });
    const server = await app.listen(PORT);
  
    const authURL = await spotifyApi.createAuthorizeURL(
      scopes,
      'state',
      autoLogin,
    );
  
    let browser = null;
  
    console.log(
      'Spotify Auth Please Wait...',
    );
  
    if (autoLogin) {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });
  
      const page = await browser.newPage();
      try {
        await page.goto(authURL);
        await page.type('#login-username', username);
        await page.type('#login-password', password);
        await page.click('#login-button');
        await page.waitForSelector('button[data-testid="auth-accept"]');
        await page.click('button[data-testid="auth-accept"]');
      } catch (e) {
        const screenshotPath = './failure.png';
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
        });
        throw new Error(
          [
            'Could not generate token',
            'Please find a screenshot of why the auto login failed at ',
            `${screenshotPath}`,
          ].join(' '),
        );
      }
    } else {
      open(authURL);
    }

    const code = await getCode;
    setTokens((await spotifyApi.authorizationCodeGrant(code)).body);

    if (browser) {
        browser.close();
      }
      server.close()
}

const checkCredentials = async () => {
    if (!spotifyApi.getAccessToken() || !spotifyApi.getRefreshToken()) {
      console.log('Les credentials ne sont pas présents. Exécution de requestAuthorizedTokens...');
      await requestAuthorizedTokens();
    } else if (spotifyApi.getAccessToken()) {
      const tokenExpirationTime = spotifyApi.getAccessTokenExpirationTime();
      const currentTime = Math.floor(Date.now() / 1000);
  
      if (currentTime >= tokenExpirationTime) {
        console.log('Le jeton d\'accès a expiré. Actualisation du jeton...');
        await refreshAccessToken();
      }
    }
};

const extractPlaylistTitles = async (playlistId) => {
    await checkCredentials();
  
    try {
      const playlist = await spotifyApi.getPlaylist(playlistId);
  
      const titles = playlist.body.tracks.items.map((item) => {
        const track = item.track;
        const title = track.name;
        const artist = track.artists.map((artist) => artist.name).join(', ');
  
        return `${title} - ${artist}`;
      });
  
      return titles;
    } catch (error) {
      console.log('Une erreur s\'est produite :', error);
    }
  };

async function searchOnYouTube(query) {
  browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });
  const page = await browser.newPage();

  await page.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`);

  await page.waitForSelector('#video-title');

  const videoURL = await page.$eval('#video-title', (element) => element.href);

  await browser.close();

  return videoURL;
}

const convertToMP3 = async (title, videoURL) => {
  try {
    const formattedTitle = title.replace(/ /g, '_');
    const outputPath = path.resolve(__dirname, `../output/${formattedTitle}.mp3`);

    const ytDlpPath = '/usr/bin/yt-dlp';

    const process = spawn(ytDlpPath, ['--extract-audio', '--audio-format', 'mp3', videoURL, '-o', outputPath]);

    process.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    process.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log('Conversion en MP3 terminée.');
        console.log('Chemin du fichier MP3 de sortie :', outputPath);
      } else {
        console.error(`La conversion en MP3 a échoué avec le code ${code}`);
      }
    });
  } catch (error) {
    console.error('Une erreur s\'est produite lors de la conversion en MP3 :', error);
  }
};

async function searchPlaylistOnYouTube(playlistId) {
  try {
    const titles = await extractPlaylistTitles(playlistId);

    console.log('Titres de la playlist :');

    for (const title of titles) {
      const query = `${title} official music video`;
      const videoURL = await searchOnYouTube(query);

      console.log(`${title} - ${videoURL}`);

      await convertToMP3(title, videoURL);
    }
  } catch (error) {
    console.log('Une erreur s\'est produite :', error);
  }
}

searchPlaylistOnYouTube(playlistId);
