# **tibber-api**

Node.js module for querying data and integrating with Tibber Pulse through Tibber API.

| Branch  | Status                                                                                                                 |
| ------- | ---------------------------------------------------------------------------------------------------------------------- |
| develop | [![Build Status](https://app.travis-ci.com/bisand/tibber-api.svg?branch=develop)](https://app.travis-ci.com/bisand/tibber-api) [![DeepScan grade](https://deepscan.io/api/teams/16513/projects/19829/branches/520996/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=16513&pid=19829&bid=520996)|
| master  | [![Build Status](https://app.travis-ci.com/bisand/tibber-api.svg?branch=master)](https://app.travis-ci.com/bisand/tibber-api) [![DeepScan grade](https://deepscan.io/api/teams/16513/projects/19829/branches/520472/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=16513&pid=19829&bid=520472) |

## General

This Node.js module is used for communication with [Tibber API](https://developer.tibber.com/) through [GraphQL](https://developer.tibber.com/docs/overview) queries and for retrieving data from Tibber Pulse via websocket.
[Tibber](https://tibber.com) is a norwegian technology focused power company which is providing tools to get more insight and controll over your home and its power consumption.

## Prerequisites

Click the link below to sign up, and receive 500 NOK to shop smart home gadgets from [Tibber Store](https://tibber.com/no/store):

> https://invite.tibber.com/3ea6e31f

You will also need an API token from Tibber. Get it here:

> https://developer.tibber.com/

## Installation

### NPM package

> https://www.npmjs.com/package/tibber-api

### Command line

```bash
npm install tibber-api
```

## TibberFeed

Realtime power consuption data from Tibber Pulse. Provide API token, Home ID and select what kind of information you want to retrieve.

> Note! There should be only one instance running of _TibberFeed_ per API key. Doing otherwise may return unpredictable result, or even error responses from the API.

### Constructor

```typescript
/**
 * Constructor for creating a new instance if TibberFeed.
 * @param config IConfig object
 * @param timeout Reconnection timeout
 * @see IConfig
 */
TibberFeed(config: IConfig, timeout: number = 30000)
```

> Created a new instance of TibberFeed with the desired configuration and timeout. The timeout is used for reconnection when no data is received within the specified time. The config object is described later in this document.

## Methods

### Connect

```typescript
/**
 * Connect to Tibber feed.
 */
Connect();
```

> Connect to Tibber Pulse realtime data feed.

### Close

```typescript
/**
 * Close the Tibber feed.
 */
Close();
```

> Disconnect from Tibber Pulse data feed.

## Events

### connected

```typescript
/**
 * Event: open
 * Called when websocket connection is established.
 * @message Information message.
 */
connected(message: string)
```

> Called when the feed is connected to Tibber.

### connection_ack

```typescript
/**
 * Event: connection_ack
 * Called when websocket connection is authenticated.
 * @message Information message.
 */
connection_ack(message: string)
```

> Called when the feed is authenticated.

### disconnected

```typescript
/**
 * Event: disconnected
 * Called when websocket connection is disconnected.
 * @message Information message.
 */
disconnected(message: string)
```

> Called when the feed is disconnected from Tibber.

### data

```typescript
/**
 * Event: data
 * Called when data is received through the websocket connection.
 * @data Incoming data message from Tibber API {@link https://developer.tibber.com/docs/reference}.
 * @see any
 */
data(data: any)
```

> Called when new data is available.

### error

```typescript
/**
 * Log function to emit error log data to subscribers.
 * @param message Log message
 */
error(error: any)
```

> Called when the feed is logging errors.

### warn

```typescript
/**
 * Log function to emit warning log data to subscribers.
 * @param message Log message
 */
warn(message: string)
```

> Called when the feed is logging warnings.

### log

```typescript
/**
 * Log function to emit log data to subscribers.
 * @param message Log message
 */
log(message: string)
```

> Called when the feed is logging.

## TibberQuery

Do basic calls to Tibber API using GraphQL queries. To query the Tibber API, simply provide raw GraphQL queries in the payload of the incoming message. See Tibber API documentation and API Explorer for more informations.

### Constructor

```typescript
/**
 * Constructor
 * Create an instace of TibberQuery class
 * @param config IConfig object
 * @see IConfig
 */
TibberQuery(config: IConfig);
```

> Created a new instance of TibberQuery with the desired configuration. The config object is described later in this document.

## Methods

### query

```typescript
/**
 * General GQL query
 * @param query GQL query.
 * @param variables Variables used by query parameter.
 * @return Query result as JSON data
 */
query(query: string, variables?: object): Promise<any>
```

> Query Tibber API with GraphQL to retrieve data. See [Tibber documentation](https://developer.tibber.com/docs/overview) for more information on QraphQL.

### getHome

```typescript
/**
 * Get selected home with some selected properties, including address and owner.
 * @param homeId Tibber home ID
 * @return IHome object
 */
getHome(homeId: string): Promise<IHome>
```

> Get home registered to your Tibber account from home ID. This function will return a IHome object including general information. To retrieve complete IHome object, please use the getHomeComplete(homeId: string) function.

### getHomeComplete

```typescript
/**
 * Get homes with all properties, including energy price, consumption and production.
 * @param homeId Tibber home ID
 * @return IHome object
 */
getHomeComplete(homeId: string): Promise<IHome>
```

> Get home registered to your Tibber account from home ID. This function will return a home object including all information.

### getHomes

```typescript
/**
 * Get homes with some selected properties, including address and owner.
 * @return Array of IHome.
 */
getHomes(): Promise<IHome[]>
```

> Get all homes registered to your Tibber account. This function will return a list of homes including general information. To retrieve complete Home objects, please use the getHomesComplete() function.

### getHomesComplete

```typescript
/**
 * Get homes with all properties, including energy price, consumption and production.
 * @return Array of IHome
 */
getHomesComplete(): Promise<IHome[]>
```

> Get all homes registered to your Tibber account. This function will return a list of homes including all information.

### getCurrentEnergyPrice

```typescript
/**
 * Get current energy price for selected home.
 * @param homeId Tibber home ID
 * @return IPrice object
 */
getCurrentEnergyPrice(homeId: string): Promise<IPrice>
```

> Get the current energy price for selected home.

### getCurrentEnergyPrices

```typescript
/**
 * Get current energy prices from all homes registered to current user
 * @return Array of IPrice
 */
getCurrentEnergyPrices(): Promise<IHome[]>
```

> Get current energy prices for all your homes.

### getTodaysEnergyPrices

```typescript
/**
 * Get energy prices for today.
 * @param homeId Tibber home ID
 * @return Array of IPrice
 */
getTodaysEnergyPrices(homeId: string): Promise<IPrice[]>
```

> Get NorPool energy prices for today for selected home.

### getTomorrowsEnergyPrices

```typescript
/**
 * Get energy prices for tomorrow. These will only be available between 12:00 and 23:59
 * @param homeId Tibber home ID
 * @return Array of IPrice
 */
getTomorrowsEnergyPrices(homeId: string): Promise<IPrice[]>
```

> Get NorPool energy prices for tomorrow for selected home. This will only return data between 12:00 and 23:59

### getConsumption

```typescript
/**
 * Get energy consumption for one or more homes.
 * Returns an array of IConsumption
 * @param resolution EnergyResolution. Valid values: HOURLY, DAILY, WEEKLY, MONTHLY, ANNUAL
 * @param lastCount Return the last number of records
 * @param homeId Tibber home ID. Optional parameter. Empty parameter will return all registered homes.
 * @return Array of IConsumption
 */
getConsumption(resolution: EnergyResolution, lastCount: number, homeId?: string): Promise<IConsumption[]>
```

> Get consumption for selected home, or all homes if homeId is not provided. EnergyResolution describes interval for data and lastCount specifies number of records to retrieve, returning the last number of records in the dataset.

## Examples

TibberFeed: typescript example.

```typescript
import { TibberFeed, IConfig } from 'tibber-api';

// Config object needed when instantiating TibberQuery
const config: IConfig = {
    // Endpoint configuration.
    apiEndpoint: {
        apiKey: '476c477d8a039529478ebd690d35ddd80e3308ffc49b59c65b142321aee963a4', // Demo token
        feedUrl: 'wss://api.tibber.com/v1-beta/gql/subscriptions',
    },
    // Query configuration.
    homeId: 'cc83e83e-8cbf-4595-9bf7-c3cf192f7d9c',
    timestamp: true,
    power: true,
};

// Instantiate TibberFeed.
const tibberFeed = new TibberFeed(config);

// Subscribe to "data" event.
tibberFeed.on('data', data => {
    console.log(data);
});

// Connect to Tibber data feed
tibberFeed.connect();
```

TibberQuery: typescript example.

```typescript
import { TibberQuery, IConfig } from 'tibber-api';
import http from 'http';

const hostname = '127.0.0.1';
const port = 3000;

// Config object needed when instantiating TibberQuery
const config: IConfig = {
    apiEndpoint: {
        apiKey: '476c477d8a039529478ebd690d35ddd80e3308ffc49b59c65b142321aee963a4', // Demo token
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
    },
};

// GraphQL query
const queryHomes = '{viewer{homes{id size appNickname appAvatar address{address1 address2 address3 postalCode city country latitude longitude}}}}';

// Instance of TibberQuery
const tibberQuery = new TibberQuery(config);

// Simple web server.
const server = http.createServer(async (req, res) => {
    // Call the Tibber API and return the result.
    const result = await tibberQuery.query(queryHomes);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
});

// Start web server.
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
```

## Config object

IConfig: typescript example.

```typescript
// Config object needed when instantiating TibberQuery
const config: IConfig = {
    // Endpoint configuration.
    apiEndpoint: {
        apiKey: '476c477d8a039529478ebd690d35ddd80e3308ffc49b59c65b142321aee963a4', // Demo token
        feedUrl: 'wss://api.tibber.com/v1-beta/gql/subscriptions',
    },
    // Query configuration.
    homeId: 'cc83e83e-8cbf-4595-9bf7-c3cf192f7d9c',
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
    currentL1: true,
    currentL2: true,
    currentL3: true,
    signalStrength: true,
};
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
