const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

var scopes = ['playlist-modify-public'],
  redirectUri = process.env.REDIRECT_URI,
  clientId = process.env.SPOTIFY_CLIENT_ID,
  state = process.env.STATE;

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

// var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
// console.log(authorizeURL); // Uncomment to get new code

// spotifyApi.authorizationCodeGrant(process.env.SPOTIFY_AUTH_CODE).then(
//   function (data) {
//     console.log('The token expires in ' + data.body['expires_in']);
//     console.log('The access token is ' + data.body['access_token']);
//     console.log('The refresh token is ' + data.body['refresh_token']);

//     // Set the access token on the API object to use it in later calls
//     spotifyApi.setAccessToken(data.body['access_token']);
//     spotifyApi.setRefreshToken(data.body['refresh_token']);
//   },
//   function (err) {
//     console.log('Something went wrong!', err);
//   }
// );

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

app.post('/playlist', async (req, res) => {
  const url = `https://www.billboard.com/charts/hot-100/${req.body.date}`;

  let scraped = await scrapeHot100(url);

  // spotifyApi
  //   .createPlaylist(`Time machine - ${req.body.date}`, { public: true })
  //   .then(
  //     function (data) {
  //       console.log('Created playlist!');
  //     },
  //     function (err) {
  //       console.log('Something went wrong!', err);
  //     }
  //   );

  spotifyApi.searchTracks('track:Alright artist:Kendrick Lamar').then(
    function (data) {
      console.log(
        'Search tracks by "Alright" in the track name and "Kendrick Lamar" in the artist name',
        data.body.tracks.items
      );
    },
    function (err) {
      console.log('Something went wrong!', err);
    }
  );

  res.send('Success!');
});

app.get('/callback', (req, res) => {
  res.send(req.query.code);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT);
