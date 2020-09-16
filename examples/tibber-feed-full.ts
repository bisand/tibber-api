// Uncomment the following line to include tibber-api NPM package instead.
// const TibberQuery = require("tibber-api").TibberFeed;

import { TibberFeed } from '../src/index';
import { IConfig } from '../src/models/IConfig';

// Config object needed when instantiating TibberQuery
const config: IConfig = {
    // Endpoint configuration.
    active: true,
    apiEndpoint: {
        apiKey: 'd1007ead2dc84a2b82f0de19451c5fb22112f7ae11d19bf2bedb224a003ff74a', // Demo token
        feedUrl: 'wss://api.tibber.com/v1-beta/gql/subscriptions',
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
    },
    // Query configuration.
    homeId: 'c70dcbe5-4485-4821-933d-a8a86452737b',
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

const tibberFeed = new TibberFeed(config);
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
