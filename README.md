# **tibber-api**

Node.js module for querying data and integrating with Tibber Pulse through Tibber API.

| Branch | Status |
| ------ | ------ |
| master | [![Node.js CI](https://github.com/bisand/tibber-api/actions/workflows/node.js.yml/badge.svg?branch=master)](https://github.com/bisand/tibber-api/actions/workflows/node.js.yml) [![Node.js Package](https://github.com/bisand/tibber-api/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/bisand/tibber-api/actions/workflows/npm-publish.yml) [![CodeQL](https://github.com/bisand/tibber-api/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/bisand/tibber-api/actions/workflows/codeql-analysis.yml) [![DeepScan grade](https://deepscan.io/api/teams/16513/projects/19829/branches/520472/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=16513&pid=19829&bid=520472) [![npm version](https://badge.fury.io/js/tibber-api.svg)](https://badge.fury.io/js/tibber-api) |

## General

This Node.js module is used for communication with [Tibber API](https://developer.tibber.com/) through [GraphQL](https://developer.tibber.com/docs/overview) queries and for retrieving data from Tibber Pulse via websocket.
[Tibber](https://tibber.com) is a norwegian technology focused power company which is providing tools to get more insight and controll over your home and its power consumption.

> **Note**
>
> **`Breaking changes!`**
>
> Version 6 introduces breaking changes in **TibberQuery** and **TibberFeed**.
>
> - All `TibberQuery` methods now reject when the Tibber API returns an error, for example an invalid token. Earlier versions returned an empty result, and `sendPushNotification` and `updateHome` returned the errors in the result. Use `try`/`catch` or `.catch()` and read `errors` on the rejected object.
> - `TibberFeed` stops reconnecting when the token is rejected and emits an `error` event. Call `connect()` to try again with a valid token.
> - `getConsumption()` without `homeId` returns a flat list with `homeId` on each record, instead of one list per home.
> - `PriceResolution.DAILY` is removed, as the price methods never accepted it. Use `PriceRangeResolution.DAILY` with `getEnergyPriceRange()`.

> **Note**
>
> **`Breaking changes!`**
>
> Version 5 introduces breaking changes in **TibberFeed**. Due to the fact that [Tibber also has introduced breaking changes in their API](https://developer.tibber.com/docs/overview#breaking-websocket-change) we had to do some small changes.
>
>Instead of changing the whole implementation, the only noticable change is done to the [constructor](#TibberFeed) of `TibberFeed` which takes a `TibberQuery` instead of and `IConfig` object and uses the config from the provided `TibberQuery`. See example below.
```typescript
...
// Instantiate TibberFeed.
const tibberQuery = new TibberQuery(config);
const tibberFeed = new TibberFeed(tibberQuery, 5000);
...
```

## Prerequisites

Click the link below to sign up, and receive 400 NOK to shop smart home gadgets from [Tibber Store](https://tibber.com/no/store):

> **[https://invite.tibber.com/fjafad7b](https://invite.tibber.com/fjafad7b)**

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

[JSDoc documentation](https://htmlpreview.github.io/?https://raw.githubusercontent.com/bisand/tibber-api/master/jsdoc/TibberFeed.html)

### Constructor

```typescript
/**
 * Constructor for creating a new instance if TibberFeed.
 * @constructor
 * @param {TibberQueryBase} tibberQuery TibberQueryBase object.
 * @param {number} timeout Feed idle timeout in milliseconds. The feed will reconnect after being idle for more than the specified number of milliseconds. Min 5000 ms.
 * @param {boolean} returnAllFields Specify if you want to return all fields from the data feed.
 * @param {number} connectionTimeout Feed connection timeout.
 * @see {@linkcode TibberQueryBase}
 */
TibberFeed(tibberQuery: TibberQueryBase, timeout: number = 60000, returnAllFields = false, connectionTimeout: number = 30000)
```

> Created a new instance of TibberFeed with with an instance of [TibberQuery](#TibberQuery) and timeout. The timeout is used for reconnection when no data is received within the specified time. The [config object](#config-object) is described later in this document.

## Methods

### Connect

```typescript
/**
 * Connect to Tibber feed.
 */
Connect();
```

> Connect to Tibber Pulse realtime data feed. The connect method has a backoff logic with jitter applied to prevent too many reconnection attemts. There is also an idle timeout functionality that ensures that the feed is always connected when it's active.

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

[JSDoc documentation](https://htmlpreview.github.io/?https://raw.githubusercontent.com/bisand/tibber-api/master/jsdoc/TibberQuery.html)


### Constructor

```typescript
/**
 * Constructor
 * Create an instace of TibberQuery class
 * @param {IConfig} config Config object
 * @param {number} requestTimeout Request timeout in milliseconds.
 * @see IConfig
 */
TibberQuery(config: IConfig, requestTimeout: number = 30000);
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
 * @param resolution Can either be "HOURLY" or "QUARTER_HOURLY"
 * @return Array of IPrice
 */
getTodaysEnergyPrices(homeId: string, resolution: string): Promise<IPrice[]>
```

> Get NorPool energy prices for today for selected home.

### getTomorrowsEnergyPrices

```typescript
/**
 * Get energy prices for tomorrow. These will only be available between 12:00 and 23:59
 * @param homeId Tibber home ID
 * @param resolution Can either be "HOURLY" or "QUARTER_HOURLY"
 * @return Array of IPrice
 */
getTomorrowsEnergyPrices(homeId: string, resolution: string): Promise<IPrice[]>
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

### getConsumptionPage

```typescript
/**
 * Get a page of energy consumption for selected home, including page info with totals and cursors.
 * @param homeId Tibber home ID
 * @param resolution EnergyResolution. Valid values: HOURLY, DAILY, WEEKLY, MONTHLY, ANNUAL
 * @param paging Which records to return. Either first or last is required.
 * @return IHomeConsumptionConnection object
 */
getConsumptionPage(homeId: string, resolution: EnergyResolution, paging: IEnergyPagingOptions): Promise<IHomeConsumptionConnection>
```

> Get consumption for selected home together with `pageInfo` (totals, count and cursors). `paging` takes `first` or `last`, optionally `before` or `after` (a cursor from `pageInfo` or a `Date`) and `filterEmptyNodes`. Tibber limits each request to 744 hourly, 31 daily, 52 weekly, 12 monthly or 1 annual records. For longer periods, page backwards by passing `pageInfo.startCursor` as `before`. Note that `before` does not include the record at the cursor, while `after` does.

```typescript
const page = await tibberQuery.getConsumptionPage(homeId, EnergyResolution.HOURLY, { first: 744, after: new Date('2026-09-01T00:00:00+02:00') });
```

### getProduction

```typescript
/**
 * Get energy production for one or more homes.
 * Returns an array of IProduction
 * @param resolution EnergyResolution. Valid values: HOURLY, DAILY, WEEKLY, MONTHLY, ANNUAL
 * @param lastCount Return the last number of records
 * @param homeId Tibber home ID. Optional parameter. Empty parameter will return all registered homes.
 * @return Array of IProduction
 */
getProduction(resolution: EnergyResolution, lastCount: number, homeId?: string): Promise<IProduction[]>
```

> Get production for selected home, or all homes if homeId is not provided. Works the same way as [getConsumption](#getConsumption).

### getProductionPage

```typescript
/**
 * Get a page of energy production for selected home, including page info with totals and cursors.
 * @param homeId Tibber home ID
 * @param resolution EnergyResolution. Valid values: HOURLY, DAILY, WEEKLY, MONTHLY, ANNUAL
 * @param paging Which records to return. Either first or last is required.
 * @return IHomeProductionConnection object
 */
getProductionPage(homeId: string, resolution: EnergyResolution, paging: IEnergyPagingOptions): Promise<IHomeProductionConnection>
```

> Get production for selected home together with `pageInfo`. Works the same way as [getConsumptionPage](#getConsumptionPage).

### getEnergyPriceRange

```typescript
/**
 * Get historical energy prices for selected home, including page info with min/max and cursors.
 * @param homeId Tibber home ID
 * @param resolution PriceRangeResolution. Valid values: DAILY, HOURLY, QUARTER_HOURLY
 * @param paging Which records to return. Either first or last is required.
 * @return ISubscriptionPriceConnection object
 */
getEnergyPriceRange(homeId: string, resolution: PriceRangeResolution, paging: IPagingOptions): Promise<ISubscriptionPriceConnection>
```

> Get historical energy prices for selected home. `paging` takes `first` or `last` and optionally `before` or `after` (a cursor from `pageInfo` or a `Date`). Tibber limits each request to 672 quarter-hourly, 744 hourly or 31 daily records. `before` does not include the record at the cursor, while `after` does. With `QUARTER_HOURLY`, Tibber works in whole hours: use a multiple of 4 for `first` and `last`, and expect cursors to be rounded down to the hour. Prices from before Tibber supported quarter-hourly prices are returned hourly, even with `QUARTER_HOURLY`.

```typescript
const prices = await tibberQuery.getEnergyPriceRange(homeId, PriceRangeResolution.QUARTER_HOURLY, { first: 96, after: new Date('2026-10-10T00:00:00+02:00') });
```

### sendPushNotification

```typescript
/**
 * Sends a push notification to the current user's tibber app.
 * Returns a ISendPushNotification Object
 * @param title: "The title of your message";
 * @param message: "The message you want to send";
 * @param screenToOpen: AppScreen Object, example: AppScreen.HOME ;
 * @return ISendPushNotification Object
 */
```

> Send a notification to the tibber app. You can specify which route shoule be opened in the App when opening the message. The notification will be send to all devices registered for that tibber account. If the send is successful the response will show how many devices the message reached.

## Tibber Data API

The [Tibber Data API](https://data-api.tibber.com/docs/) gives access to devices paired to Tibber: electric vehicles, chargers, thermostats, heat pumps, inverters and batteries, and live measurements from Tibber Pulse and Watty. It is a separate API from the GraphQL API used by `TibberQuery` and `TibberFeed`. It does not serve prices, and it does not accept the personal access tokens used above. You need an OAuth client, created at [Manage clients](https://data-api.tibber.com/clients/manage/), and the user must log in and give consent.

### TibberOAuth

```typescript
const oauth = new TibberOAuth({
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    redirectUri: 'http://localhost:8787/callback',
    scopes: Object.values(DataScope), // Defaults to the scopes needed to list homes.
    userAgent: 'MyApp/1.0',
});

// 1. Send the user to the URL. Keep state and codeVerifier.
const { url, state, codeVerifier } = oauth.createAuthorizationUrl();

// 2. Tibber redirects to redirectUri with ?code=...&state=... Compare state, then exchange the code.
const tokens = await oauth.exchangeCode(code, codeVerifier);

// 3. Get a new access token when the old one has expired. TibberData does this for you.
const newTokens = await oauth.refresh(tokens.refreshToken);
```

> Access tokens last about an hour and refresh tokens about 30 days. Tibber may replace the refresh token on every refresh, so always store the latest `ITokenSet`. A device is only visible if the access token has the scope for its category, see `DataScope`.

### TibberData

```typescript
const tibberData = new TibberData({
    tokens, // or accessToken: '...' if you handle the tokens yourself
    oauth, // optional, enables automatic refresh of the access token
    onTokensRefreshed: (newTokens) => saveTokens(newTokens),
    userAgent: 'MyApp/1.0',
});

const homes = await tibberData.getHomes();
const devices = await tibberData.getDevices(homes[0].id);
const device = await tibberData.getDevice(homes[0].id, devices[0].id);
```

| Method | Description |
| ------ | ----------- |
| `getHomes(): Promise<IDataHome[]>` | Homes the user has access to. |
| `getDevices(homeId): Promise<IDataDeviceItem[]>` | Devices in a home. |
| `getDevice(homeId, deviceId): Promise<IDataDevice>` | A device with its attributes and current capabilities (state values with units). |
| `getDeviceHistory(homeId, deviceId, options): Promise<IDataDeviceHistory>` | First page of history. `options` takes a `DeviceHistoryResolution` and either `since` or `until`. |
| `getDeviceHistoryPage(link): Promise<IDataDeviceHistory>` | Another page of history, from the `next` or `prev` link of the previous page. |
| `getLiveEventDevices(homeId): Promise<IDataLiveEventDevice[]>` | Devices that can stream live measurements right now. Their IDs are not the same as the device IDs from `getDevices`. |
| `get(path): Promise<any>` | General GET request, for endpoints not covered above. |

> Requests are retried with backoff on `429` and `5xx` responses, and the access token is refreshed once on `401`. Other failures reject with a `TibberDataError` that has the HTTP `status` and the response `body`. Only devices with resolutions in `supportedHistory` have history.

### TibberDataFeed

Live measurements from Tibber Pulse and Watty as Server-Sent Events. The access token needs the scope `data-api-meters-read`.

```typescript
const devices = await tibberData.getLiveEventDevices(homeId);
const tibberDataFeed = new TibberDataFeed(tibberData, homeId, devices.map((device) => device.id));

tibberDataFeed.on('data', (data: IDataLiveMeasurement) => console.log(data));
tibberDataFeed.on('stream_error', (error: IDataStreamError) => console.log(error));
tibberDataFeed.on('error', (error) => console.error(error));

await tibberDataFeed.connect();
```

> Events: `connecting`, `connected`, `disconnected`, `data`, `ping`, `stream_error`, `heartbeat_timeout`, `error`, `warn` and `log`. The feed reconnects with backoff when the connection is lost or the server reports a transient error. It closes without reconnecting when the server reports a permanent error.

> Note! Tibber allows one live feed per home. Opening a second one closes the first with the stream error `evicted`, and the evicted feed does not reconnect. Between 1 and 5 devices can be streamed per feed. Measurements from the Data API use `voltageL1`-`voltageL3`, where `TibberFeed` uses `voltagePhase1`-`voltagePhase3`.

See [examples/data-api-login.ts](examples/data-api-login.ts), [examples/data-api-devices.ts](examples/data-api-devices.ts) and [examples/data-api-feed.ts](examples/data-api-feed.ts) for complete examples.

## Examples

TibberFeed: typescript example.

```typescript
import { TibberFeed, TibberQuery, TibberQueryBase, IConfig } from 'tibber-api';

// Config object needed when instantiating TibberQuery
const config: IConfig = {
    // Endpoint configuration.
    apiEndpoint: {
        apiKey: '3A77EECF61BD445F47241A5A36202185C35AF3AF58609E19B53F3A8872AD7BE1-1', // Demo token
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
        requestTimeout: 5000,
    },
    // Query configuration.
    homeId: '96a14971-525a-4420-aae9-e5aedaa129ff',
    timestamp: true,
    power: true,
};

// Instantiate TibberFeed.
const tibberQuery = new TibberQuery(config);
const tibberFeed = new TibberFeed(tibberQuery, 5000);

// Subscribe to "data" event.
tibberFeed.on('data', (data) => {
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
        apiKey: '3A77EECF61BD445F47241A5A36202185C35AF3AF58609E19B53F3A8872AD7BE1-1', // Demo token
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
        requestTimeout: 5000,
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
        apiKey: '3A77EECF61BD445F47241A5A36202185C35AF3AF58609E19B53F3A8872AD7BE1-1', // Demo token
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
        requestTimeout: 5000,
    },
    // Query configuration.
    homeId: '96a14971-525a-4420-aae9-e5aedaa129ff',
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
    powerReactive: true,
    powerProductionReactive: true,
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

[MIT](
//choosealicense.com/licenses/mit/)
