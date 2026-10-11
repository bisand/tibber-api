// Uncomment the following line to include tibber-api NPM package instead.
// const { TibberData, TibberDataFeed, TibberOAuth } = require("tibber-api");

// Stream live measurements from Tibber Pulse or Watty through the Tibber Data API.
// Run examples/data-api-login.ts first to create the token file. The scope data-api-meters-read is required.
// Run: node --env-file=.env lib/examples/data-api-feed.js

import { TibberData, TibberDataFeed, TibberOAuth, ITokenSet, IDataLiveMeasurement } from '../src/index';
import fs from 'fs';

const tokenFile = '.tibber-data-tokens.json';
const tokens: ITokenSet = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));

const oauth = new TibberOAuth({
    clientId: process.env.TIBBER_CLIENT_ID ?? '',
    clientSecret: process.env.TIBBER_CLIENT_SECRET,
    redirectUri: process.env.TIBBER_REDIRECT_URI ?? 'http://localhost:8787/callback',
    userAgent: 'tibber-api-example/1.0',
});

const tibberData = new TibberData({
    tokens,
    oauth,
    onTokensRefreshed: (newTokens) => fs.writeFileSync(tokenFile, JSON.stringify(newTokens, null, 2), { mode: 0o600 }),
    userAgent: 'tibber-api-example/1.0',
});

(async () => {
    const [home] = await tibberData.getHomes();
    // Always ask which devices can be streamed right now.
    const devices = await tibberData.getLiveEventDevices(home.id);
    if (devices.length === 0) {
        console.log('No devices can stream live measurements.');
        return;
    }

    // Instance of TibberDataFeed
    const tibberDataFeed = new TibberDataFeed(tibberData, home.id, devices.map((device) => device.id).slice(0, TibberDataFeed.MAX_DEVICES));

    // Subscribe to "data" event.
    tibberDataFeed.on('data', (data: IDataLiveMeasurement) => {
        console.log(data);
    });
    tibberDataFeed.on('connected', (message) => console.log(message));
    tibberDataFeed.on('disconnected', (message) => console.log(message));
    tibberDataFeed.on('stream_error', (error) => console.log(error));
    tibberDataFeed.on('error', (error) => console.error(error));
    tibberDataFeed.on('warn', (message) => console.warn(message));

    // Connect to the Tibber Data API and start streaming.
    await tibberDataFeed.connect();
})().catch((error) => console.error(error));
