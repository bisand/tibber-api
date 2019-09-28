// Uncomment the following line to include tibber-api NPM package instead.
// const TibberQuery = require("tibber-api").TibberQuery;

const TibberQuery = require('../lib/index').TibberQuery;
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

// Config object needed when instantiating TibberQuery
let config = {
    apiEndpoint: {
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
        apiKey: 'd1007ead2dc84a2b82f0de19451c5fb22112f7ae11d19bf2bedb224a003ff74a', // Demo token
    },
};

// GraphQL query
let queryHomes =
    '{viewer{homes{id size appNickname appAvatar address{address1 address2 address3 postalCode city country latitude longitude}}}}';

// Instance of TibberQuery
let tibberQuery = new TibberQuery(config);

// Simple web server.
const server = http.createServer(async (req, res) => {
    // Call the Tibber API and return the result.
    let result = await tibberQuery.query(queryHomes);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result.viewer.homes));
});

// Start web server.
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
