// Uncomment the following line to include tibber-api NPM package instead.
// const TibberFeed = require("tibber-api").TibberFeed;

import { TibberFeed, IConfig } from '../src/index';

// Config object needed when instantiating TibberQuery
const config: IConfig = {
    // Endpoint configuration.
    active: true,
    apiEndpoint: {
        apiKey: '5K4MVS-OjfWhK_4yrjOlFe1F6kJXPVf7eQYggo8ebAE', // Demo token
        feedUrl: 'wss://api.tibber.com/v1-beta/gql/subscriptions',
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
    },
    // Query configuration.
    homeId: '96a14971-525a-4420-aae9-e5aedaa129ff',
    timestamp: true,
    power: true,
};

// Instantiate TibberFeed.
const tibberFeed = new TibberFeed(config);

let counter = 0;
// Subscribe to "data" event.
tibberFeed.on('data', data => {
    // Close connection after receiving more tham 10 messages.
    if(counter++ >= 5){
        tibberFeed.close();
    }
    console.log(counter +' - ' + JSON.stringify(data));
});

tibberFeed.on('connecting', data => {
    console.log(data);
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
