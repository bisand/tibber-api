// Uncomment the following line to include tibber-api NPM package instead.
// const TibberQuery = require("tibber-api").TibberQuery;

import { TibberQuery, IConfig } from '../src/index';
import http from 'http';
import { ISendPushNotificationPayload } from '../src/models/ISendPushNotificationPayload';
import { AppScreen } from '../src/models/enums/AppScreen';

const hostname = '127.0.0.1';
const port = 3000;

// Config object needed when instantiating TibberQuery
const config: IConfig = {
    active: true,
    apiEndpoint: {
        apiKey: '476c477d8a039529478ebd690d35ddd80e3308ffc49b59c65b142321aee963a4', // Demo token
        feedUrl: 'wss://api.tibber.com/v1-beta/gql/subscriptions',
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
    },
};

// Instance of TibberQuery
const tibberQuery = new TibberQuery(config);

// Simple web server.
const server = http.createServer(async (req, res) => {
    // Call the Tibber API and return the result.
    const messagePayloadVariables: ISendPushNotificationPayload = {
        input: { title: 'TITLE', message: 'MESSAGE', screenToOpen: AppScreen.HOME },
    };

    switch (req.url) {
        case '/push':
            const result = await tibberQuery.sendPushNotification(messagePayloadVariables);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
            console.log(JSON.stringify(result));
            break;
    }
});

// Start web server.
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
