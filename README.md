# Spotify Time Machine

This app uses [cheerio](https://www.npmjs.com/package/cheerio) to scrape the Billboard Hot 100 list, and the Spotify API to create a custom playlist with those songs.

To use, clone this repo, run `npm install`, create a `.env` file with the following values defined:

```javascript
SPOTIFY_CLIENT_ID = '';
SPOTIFY_CLIENT_SECRET = '';
REDIRECT_URI = '';
SPOTIFY_AUTH_CODE = '';
SPOTIFY_REFRESH_TOKEN = '';
```

You will need to get these values from Spotify.

### Notes

1. Please remember rate limiting. In my experience, you can only create 1 playlist every ~10 minutes.
2. I may extend this project to have a front end. If/when I do, this Readme will be updated.
