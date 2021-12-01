// Uncomment the following line to include tibber-api NPM package instead.
// const TibberQuery = require("tibber-api").TibberFeed;

import { TibberFeed } from '../src/index';
import { IConfig } from '../src/models/IConfig';

// Config object needed when instantiating TibberQuery
const config: IConfig = {
    // Endpoint configuration.
    active: true,
    apiEndpoint: {
        apiKey: '476c477d8a039529478ebd690d35ddd80e3308ffc49b59c65b142321aee963a4', // Demo token
        feedUrl: 'wss://api.tibber.com/v1-beta/gql/subscriptions',
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
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
