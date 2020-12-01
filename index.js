const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

var credentials = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
};

var spotifyApi = new SpotifyWebApi(credentials);

spotifyApi.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN);

spotifyApi.refreshAccessToken().then(
  function (data) {
    console.log('The access token has been refreshed!');

    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body['access_token']);
  },
  function (err) {
    console.log('Could not refresh access token', err);
  }
);

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());

const fetchHTML = async (url) => {
  try {
    const { data } = await axios.get(url);
    return data;
  } catch {
    console.error(
      `ERROR: An error occurred while trying to fetch the URL: ${url}`
    );
  }
};

const scrapeHot100 = async (url) => {
  let list = [];

  const html = await fetchHTML(url);
  const $ = cheerio.load(html);

  await $('.chart-list__elements')
    .find('.chart-element__information')
    .each((index, element) => {
      let songName = $(element)
        .find('.chart-element__information__song')
        .text();
      let artist = $(element)
        .find('.chart-element__information__artist')
        .text();

      list.push({ songName, artist });
    });

  return list;
};

const fillArray = async (tracks) => {
  let list = [];

  let promiseArray = tracks.map(async ({ songName, artist }) => {
    let track = await spotifyApi.searchTracks(
      `track:${songName} artist:${artist}`
    );

    if (track != undefined) {
      if (track.body.tracks.items.length > 0) {
        list.push(`spotify:track:${track.body.tracks.items[0].id}`);
      }
    }
  });

  const results = await Promise.all(promiseArray);

  return list;
};

app.post('/playlist', async (req, res) => {
  try {
    const url = `https://www.billboard.com/charts/hot-100/${req.body.date}`;
    let scraped = await scrapeHot100(url);

    let newPlaylist = await spotifyApi.createPlaylist(
      `Time machine - ${req.body.date}`,
      { public: true }
    );

    let listOfSongs = await fillArray(scraped);

    console.log('list of songs', listOfSongs);

    spotifyApi.addTracksToPlaylist(newPlaylist.body.id, listOfSongs).then(
      function (data) {
        console.log('Added tracks to playlist!');
      },
      function (err) {
        console.log('Something went wrong!', err);
      }
    );

    res.send('Success!');
  } catch (e) {
    console.log('Something went wrong...', e);
    res.send('Error', e);
  }
});

app.get('/callback', (req, res) => {
  res.send(req.query.code);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT);
