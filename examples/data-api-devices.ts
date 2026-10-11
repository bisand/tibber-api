// Uncomment the following line to include tibber-api NPM package instead.
// const { TibberData, TibberOAuth } = require("tibber-api");

// List homes and devices from the Tibber Data API.
// Run examples/data-api-login.ts first to create the token file.
// Run: node --env-file=.env lib/examples/data-api-devices.js

import { TibberData, TibberOAuth, ITokenSet } from '../src/index';
import fs from 'fs';

const tokenFile = '.tibber-data-tokens.json';
const tokens: ITokenSet = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));

const oauth = new TibberOAuth({
    clientId: process.env.TIBBER_CLIENT_ID ?? '',
    clientSecret: process.env.TIBBER_CLIENT_SECRET,
    redirectUri: process.env.TIBBER_REDIRECT_URI ?? 'http://localhost:8787/callback',
    userAgent: 'tibber-api-example/1.0',
});

// Instance of TibberData. The access token is refreshed when needed, and the new tokens are saved.
const tibberData = new TibberData({
    tokens,
    oauth,
    onTokensRefreshed: (newTokens) => fs.writeFileSync(tokenFile, JSON.stringify(newTokens, null, 2), { mode: 0o600 }),
    userAgent: 'tibber-api-example/1.0',
});

(async () => {
    const homes = await tibberData.getHomes();
    for (const home of homes) {
        console.log(`Home: ${home.name} (${home.id})`);
        const devices = await tibberData.getDevices(home.id);
        for (const item of devices) {
            const device = await tibberData.getDevice(home.id, item.id);
            console.log(`  ${device.info.brand} ${device.info.name} (${device.id})`);
            for (const capability of device.capabilities) {
                console.log(`    ${capability.id}: ${capability.value} ${capability.unit ?? ''}`);
            }
        }
    }
})().catch((error) => console.error(error));
