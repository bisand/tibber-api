// Uncomment the following line to include tibber-api NPM package instead.
// const TibberFeed = require("tibber-api").TibberFeed;

import {TibberFeed} from '../lib/index';
import { IConfig } from '../src/models/config';

// Config object needed when instantiating TibberQuery
const config: IConfig = {
    // Endpoint configuration.
    apiEndpoint: {
        apiKey: 'd1007ead2dc84a2b82f0de19451c5fb22112f7ae11d19bf2bedb224a003ff74a', // Demo token
        feedUrl: 'wss://api.tibber.com/v1-beta/gql/subscriptions',
    },
    // Query configuration.
    homeId: 'c70dcbe5-4485-4821-933d-a8a86452737b',
    timestamp: true,
    // tslint:disable-next-line: object-literal-sort-keys
    power: true,
};

const tibberFeed = new TibberFeed(config);
tibberFeed.on('data', data => {
    console.log(data);
});
tibberFeed.connect();
