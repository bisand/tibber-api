// Uncomment the following line to include tibber-api NPM package instead.
// const TibberFeed = require("tibber-api").TibberFeed;

import { TibberFeed, IConfig } from '../src/index';

// Config object needed when instantiating TibberQuery
const config: IConfig = {
    // Endpoint configuration.
    active: true,
    apiEndpoint: {
        apiKey: 'd1007ead2dc84a2b82f0de19451c5fb22112f7ae11d19bf2bedb224a003ff74a', // Demo token
        feedUrl: 'wss://api.tibber.com/v1-beta/gql/subscriptions',
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
    },
    // Query configuration.
    homeId: 'c70dcbe5-4485-4821-933d-a8a86452737b',
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

tibberFeed.on('disconnected', data => {
    console.log(data);
});

// Connect to Tibber data feed
tibberFeed.connect();
