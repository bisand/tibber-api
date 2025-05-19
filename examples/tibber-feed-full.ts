import * as url from 'url';
import { TibberFeed, TibberQuery, TibberQueryBase } from './../src/index';
import { IConfig } from './../src/models/IConfig';

// Config object needed when instantiating TibberQuery
const config: IConfig = {
    // Endpoint configuration.
    active: true,
    apiEndpoint: {
        apiKey: '3A77EECF61BD445F47241A5A36202185C35AF3AF58609E19B53F3A8872AD7BE1-1', // Demo token
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

export class FakeTibberQuery extends TibberQueryBase {
    public override async getWebsocketSubscriptionUrl(): Promise<url.URL> {
        return new Promise<url.URL>((resolve, reject) => {
            resolve(new url.URL('wss://vg.no/'))
        });
    }
}

const tibberQuery = new TibberQuery(config);
const tibberFeed = new TibberFeed(tibberQuery, 5000);
tibberFeed.on('connected', () => {
    console.log('Connected to Tibber!');
});
tibberFeed.on('connection_ack', () => {
    console.log('Connection acknowledged!');
});
tibberFeed.on('disconnected', async () => {
    console.log('Disconnected from Tibber!');
});
tibberFeed.on('error', async error => {
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

setInterval(async () => {
    if (!tibberFeed.connected)
        await tibberFeed.connect();

}, 1000);