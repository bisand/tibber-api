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
        apiKey: '3A77EECF61BD445F47241A5A36202185C35AF3AF58609E19B53F3A8872AD7BE1-1', // Demo token
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
    },
};

// Instance of TibberQuery
const tibberQuery = new TibberQuery(config);

// Simple web server.
const server = http.createServer(async (req, res) => {
    // Call the Tibber API and return the result.
    // const result = await tibberQuery.getConsumption(EnergyResolution.HOURLY, 10);
    const result = await tibberQuery.getConsumption(EnergyResolution.HOURLY, 10);// , '96a14971-525a-4420-aae9-e5aedaa129ff');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
});

// Start web server.
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
