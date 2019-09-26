# tibber-api

Node.js module for querying data and integrating with Tibber Pulse through Tibber API.

> *Warning! This is early stage development.*

|  Branch  | Status           |
|----------|------------------|
|develop   | [![Build Status](https://travis-ci.org/bisand/tibber-api.svg?branch=develop)](https://travis-ci.org/bisand/tibber-api) |
| master | [![Build Status](https://travis-ci.org/bisand/tibber-api.svg?branch=master)](https://travis-ci.org/bisand/tibber-api) |
 
## General

This Node.js module is used for communication with [Tibber API](https://developer.tibber.com/) through [GraphQL](https://developer.tibber.com/docs/overview) queries and for retrieving data from Tibber Pulse via websocket.
[Tibber](https://tibber.com) is a norwegian technology focused power company which is providing tools to get more insight and controll over your home and its power consumption.

## Prerequisites

Sign up here:
> https://invite.tibber.com/9136154c

You will also need an API token from Tibber. Get it here:

> https://developer.tibber.com/

## Installation

### NPM package

> https://www.npmjs.com/package/tibber-api

### Command line

```bash
npm install tibber-api
```

## Nodes

## TibberFeed

Realtime power consuption data from Tibber Pulse. Provide API token, Home ID and select what kind of information you want to retrieve.
> Note! There should be only one instance running of *TibberFeed* per API key. Doing otherwise may return unpredictable result, or even error responses from the API.

### Constructor

**TibberFeed(config, timeout = 30000)**

Created a new instance of TibberFeed with the desired configuration and timeout. The timeout is used for reconnection when no data is received within the specified time. The config object is described later in this document.

### Methods

**Connect()**

Connect to Tibber Pulse realtime data feed.

**Close()**

Disconnect from Tibber Pulse data feed.

### Events

**connected**

Called when the feed is connected to Tibber.

**connection_ack**

Called when the feed is authenticated.

**disconnected**

Called when the feed is disconnected from Tibber.

**data**

Called when new data is available.

**error**

Called when the feed is logging errors.

**warn**

Called when the feed is logging warnings.

**log**

Called when the feed is logging.


## TibberQuery

Do basic calls to Tibber API using GraphQL queries. To query the Tibber API, simply provide raw GraphQL queries in the payload of the incoming message. See Tibber API documentation and API Explorer for more informations.

### Constructor

**TibberQuery(config)**

Created a new instance of TibberQuery with the desired configuration. The config object is described later in this document.

### Methods

**query(graphQL-query)**

Query Tibber API with GraphQL to retrieve data. See [Tibber documentation](https://developer.tibber.com/docs/overview) for more information on QraphQL.

## Examples

TibberFeed:

```javascript
const TibberFeed = require("tibber-api").TibberFeed;

// Config object needed when instantiating TibberQuery
let config = {
    // Endpoint configuration.
    apiEndpoint: {
        feedUrl: "wss://api.tibber.com/v1-beta/gql/subscriptions",
        apiKey: "d1007ead2dc84a2b82f0de19451c5fb22112f7ae11d19bf2bedb224a003ff74a" // Demo token
    },
    // Query configuration.
    homeId: "c70dcbe5-4485-4821-933d-a8a86452737b",
    timestamp: true,
    power: true,
};

// Instantiate TibberFeed.
let tibberFeed = new TibberFeed(config);

// Subscribe to "data" event.
tibberFeed.on("data", (data) => {
    console.log(data);
});

tibberFeed.connect();
```

TibberQuery:

```javascript
const TibberQuery = require("tibber-api").TibberQuery;
const http = require("http");

const hostname = "127.0.0.1";
const port = 3000;

// Config object needed when instantiating TibberQuery
let config = {
  apiEndpoint: {
    queryUrl: "https://api.tibber.com/v1-beta/gql",
    feedUrl: "wss://api.tibber.com/v1-beta/gql/subscriptions",
    apiKey: "d1007ead2dc84a2b82f0de19451c5fb22112f7ae11d19bf2bedb224a003ff74a" // Demo token
  }
};

// GraphQL query
let queryHomes =
  "{viewer{homes{id size appNickname appAvatar address{address1 address2 address3 postalCode city country latitude longitude}}}}";

// Instance of TibberQuery
let tibberQuery = new TibberQuery(config);

// Simple web server.
const server = http.createServer(async (req, res) => {
  // Call the Tibber API and return the result.
  let result = await tibberQuery.query(queryHomes);
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(result.viewer.homes));
});

// Start web server.
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```

## Config object
```javascript
config = {
    // Endpoint configuration.
    apiEndpoint: {
        queryUrl: "https://api.tibber.com/v1-beta/gql",
        feedUrl: "wss://api.tibber.com/v1-beta/gql/subscriptions",
        apiKey: "d1007ead2dc84a2b82f0de19451c5fb22112f7ae11d19bf2bedb224a003ff74a" // Demo token
    },
    // Query configuration only applicable to TibberFeed.
    homeId: "c70dcbe5-4485-4821-933d-a8a86452737b",
    timestamp: true,
    power: true,
    lastMeterConsumption: true,
    accumulatedConsumption: true,
    accumulatedProduction: true,
    accumulatedCost: true,
    accumulatedReward: true,
    currency: true,
    minPower: true,
    averagePower: true,
    maxPower: true,
    powerProduction: true,
    minPowerProduction: true,
    maxPowerProduction: true,
    lastMeterProduction: true,
    powerFactor: true,
    voltagePhase1: true,
    voltagePhase2: true,
    voltagePhase3: true,
    currentPhase1: true,
    currentPhase2: true,
    currentPhase3: true,
}
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
