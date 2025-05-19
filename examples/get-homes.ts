// Uncomment the following line to include tibber-api NPM package instead.
// const TibberQuery = require("tibber-api").TibberQuery;

import { TibberQuery, IConfig } from '../src/index';
import http from 'http';

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

// GraphQL query
const queryHomes = 'query{viewer{homes{id size appNickname appAvatar address{address1 address2 address3 postalCode city country latitude longitude}}}}';

// Instance of TibberQuery
const tibberQuery = new TibberQuery(config);

// Simple web server.
const server = http.createServer(async (req, res) => {
    // Call the Tibber API and return the result.
    const result = await tibberQuery.query(queryHomes);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.write('<html><body><h1>Hello Tibber API</h1>');
    res.write('Home Id: ' + result.viewer.homes[0].id);
    res.write('<br/>Address: ' + result.viewer.homes[0].address.address1);
    res.end('</body></html>');
});

// Start web server.
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
