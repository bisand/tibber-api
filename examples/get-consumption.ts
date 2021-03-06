// Uncomment the following line to include tibber-api NPM package instead.
// const TibberQuery = require("tibber-api").TibberQuery;

import { TibberQuery, IConfig } from '../src/index';
import http from 'http';
import { EnergyResolution } from '../src/models/enums/EnergyResolution';

const hostname = '127.0.0.1';
const port = 3000;

// Config object needed when instantiating TibberQuery
const config: IConfig = {
    active: true,
    apiEndpoint: {
        apiKey: 'd1007ead2dc84a2b82f0de19451c5fb22112f7ae11d19bf2bedb224a003ff74a', // Demo token
        feedUrl: 'wss://api.tibber.com/v1-beta/gql/subscriptions',
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
    },
};

// Instance of TibberQuery
const tibberQuery = new TibberQuery(config);

// Simple web server.
const server = http.createServer(async (req, res) => {
    // Call the Tibber API and return the result.
    // const result = await tibberQuery.getConsumption(EnergyResolution.HOURLY, 10);
    const result = await tibberQuery.getConsumption(EnergyResolution.HOURLY, 10);// , 'c70dcbe5-4485-4821-933d-a8a86452737b');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
});

// Start web server.
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
