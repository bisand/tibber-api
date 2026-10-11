// Uncomment the following line to include tibber-api NPM package instead.
// const { TibberOAuth, DataScope } = require("tibber-api");

// Log in to the Tibber Data API and save the tokens to a local file.
//
// 1. Create an OAuth client at https://data-api.tibber.com/clients/manage/
//    with the redirect URI http://localhost:8787/callback
// 2. Set TIBBER_CLIENT_ID, TIBBER_CLIENT_SECRET and TIBBER_REDIRECT_URI, for example in a .env file
// 3. Run: node --env-file=.env lib/examples/data-api-login.js

import { TibberOAuth, DataScope } from '../src/index';
import http from 'http';
import fs from 'fs';

const tokenFile = '.tibber-data-tokens.json';
const redirectUri = process.env.TIBBER_REDIRECT_URI ?? 'http://localhost:8787/callback';

const oauth = new TibberOAuth({
    clientId: process.env.TIBBER_CLIENT_ID ?? '',
    clientSecret: process.env.TIBBER_CLIENT_SECRET,
    redirectUri,
    // Request only the scopes that are enabled on your client.
    scopes: process.env.TIBBER_SCOPES?.split(' ') ?? Object.values(DataScope),
    userAgent: 'tibber-api-example/1.0',
});

const { url, state, codeVerifier } = oauth.createAuthorizationUrl();

// Simple web server that receives the redirect from Tibber.
const server = http.createServer(async (req, res) => {
    const callback = new URL(req.url ?? '/', redirectUri);
    if (callback.pathname !== new URL(redirectUri).pathname) {
        res.statusCode = 404;
        res.end();
        return;
    }
    res.setHeader('Content-Type', 'text/plain');
    try {
        const code = callback.searchParams.get('code');
        if (!code || callback.searchParams.get('state') !== state) {
            throw new Error(callback.searchParams.get('error_description') ?? callback.searchParams.get('error') ?? 'Missing code or wrong state');
        }
        const tokens = await oauth.exchangeCode(code, codeVerifier);
        fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 2), { mode: 0o600 });
        res.end('Logged in. You can close this window.');
        console.log(`Tokens saved to ${tokenFile}`);
    } catch (error: any) {
        res.statusCode = 400;
        res.end(`Login failed: ${error.message}`);
        console.error(`Login failed: ${error.message}`);
    }
    server.close();
});

// Start web server.
server.listen(Number(new URL(redirectUri).port || 80), new URL(redirectUri).hostname, () => {
    console.log(`Open this URL in your browser to log in:\n\n${url}\n`);
});
