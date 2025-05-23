// Uncomment the following line to include tibber-api NPM package instead.
// const TibberFeed = require("tibber-api").TibberFeed;

import { TibberFeed, IConfig, TibberQuery } from '../src/index';

// Config object needed when instantiating TibberQuery
const config: IConfig = {
    // Endpoint configuration.
    active: true,
    apiEndpoint: {
        apiKey: '3A77EECF61BD445F47241A5A36202185C35AF3AF58609E19B53F3A8872AD7BE1-1', // Demo token
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
    },
    // Query configuration.
    homeId: '96a14971-525a-4420-aae9-e5aedaa129ff',
    timestamp: true,
    power: true,
};

const tibberQuery = new TibberQuery(config);
const tibberFeed = new TibberFeed(tibberQuery);
let counter = 0;
// Subscribe to "data" event.
tibberFeed.on('data', data => {
    // Close connection after receiving more tham 10 messages.
    if (counter++ >= 5) {
        tibberFeed.close();
    }
    console.log(counter + ' - ' + JSON.stringify(data));
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

async function app() {
    // Connect to Tibber data feed
    await tibberFeed.connect();
    console.log('Complete!');
}

app();
