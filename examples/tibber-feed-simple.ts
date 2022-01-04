// Uncomment the following line to include tibber-api NPM package instead.
// const TibberFeed = require("tibber-api").TibberFeed;

import { TibberFeed, IConfig } from '../src/index';

// Config object needed when instantiating TibberQuery
const config: IConfig = {
    // Endpoint configuration.
    active: true,
    apiEndpoint: {
        apiKey: '476c477d8a039529478ebd690d35ddd80e3308ffc49b59c65b142321aee963a4', // Demo token
        feedUrl: 'wss://api.tibber.com/v1-beta/gql/subscriptions',
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
    },
    // Query configuration.
    homeId: 'cc83e83e-8cbf-4595-9bf7-c3cf192f7d9c',
    timestamp: true,
    power: true,
};

// Instantiate TibberFeed.
const tibberFeed = new TibberFeed(config);

let counter = 0;
// Subscribe to "data" event.
tibberFeed.on('data', data => {
    // Close connection after receiving more tham 10 messages.
    if(counter++ >= 10){
        tibberFeed.close();
    }
    console.log(counter +' - ' + data);
});

tibberFeed.on('connected', data => {
    console.log(data);
});

tibberFeed.on('disconnecting', data => {
    console.log(data);
});

tibberFeed.on('disconnected', data => {
    console.log(data);
});

// Connect to Tibber data feed
tibberFeed.connect();
