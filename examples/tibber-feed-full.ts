// Uncomment the following line to include tibber-api NPM package instead.
// const TibberQuery = require("tibber-api").TibberFeed;

import { TibberFeed, TibberQuery } from '../src/index';
import { IConfig } from '../src/models/IConfig';

// Config object needed when instantiating TibberQuery
const config: IConfig = {
    // Endpoint configuration.
    active: true,
    apiEndpoint: {
        apiKey: '5K4MVS-OjfWhK_4yrjOlFe1F6kJXPVf7eQYggo8ebAE', // Demo token
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
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
    powerProduction: false,
    minPowerProduction: false,
    maxPowerProduction: false,
    lastMeterProduction: false,
    powerFactor: true,
    voltagePhase1: true,
    voltagePhase2: true,
    voltagePhase3: true,
    currentL1: true,
    currentL2: true,
    currentL3: true,
    signalStrength: true,
};

const tibberQuery = new TibberQuery(config);
tibberQuery.getWebsocketSubscriptionUrl().then(url => {
    config.apiEndpoint.queryUrl = url.href;
    const tibberFeed = new TibberFeed(tibberQuery);
    tibberFeed.on('connected', () => {
        console.log('Connected to Tibber!');
    });
    tibberFeed.on('connection_ack', () => {
        console.log('Connection acknowledged!');
    });
    tibberFeed.on('disconnected', () => {
        console.log('Disconnected from Tibber!');
    });
    tibberFeed.on('error', error => {
        console.error(error);
    });
    tibberFeed.on('warn', warn => {
        console.warn(warn);
    });
    tibberFeed.on('log', log => {
        console.log(log);
    });
    tibberFeed.on('data', data => {
        console.log(data);
    });
    tibberFeed.connect();
});
