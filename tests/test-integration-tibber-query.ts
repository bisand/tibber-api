/* eslint-env mocha */
import { TibberQuery, IConfig } from '../src/index';
import http from 'http';
import { EnergyResolution } from '../src/models/enums/EnergyResolution';
import { IConsumption } from '../src/models/IConsumption';

const config: IConfig = {
    active: true,
    apiEndpoint: {
        apiKey: 'd1007ead2dc84a2b82f0de19451c5fb22112f7ae11d19bf2bedb224a003ff74a', // Demo token
        feedUrl: 'wss://api.tibber.com/v1-beta/gql/subscriptions',
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
    },
};

// Instance of TibberQuery
const tibberQuery = new TibberQuery(config);

test('TibberQuery.getHomes() should be valid', async () => {
    const homes = await tibberQuery.getHomes();
    expect(homes).toBeDefined();
    expect(homes.length).toBeGreaterThan(0);
    homes.forEach(home => {
        expect(home).toBeDefined();
        expect(home.address).toBeDefined();
        expect(home.owner).toBeDefined();
        expect(home.meteringPointData).toBeDefined();
        expect(home.features).toBeDefined();
    });
});

test('TibberQuery.getHomesComplete() should be valid', async () => {
    const homes = await tibberQuery.getHomesComplete();
    expect(homes).toBeDefined();
    expect(homes.length).toBeGreaterThan(0);
    homes.forEach(home => {
        expect(home).toBeDefined();
        expect(home.address).toBeDefined();
        expect(home.owner).toBeDefined();
        expect(home.meteringPointData).toBeDefined();
        expect(home.currentSubscription).toBeDefined();
        expect(home.subscriptions).toBeDefined();
        expect(home.features).toBeDefined();
    });
});

test('TibberQuery.getConsumption() with homeId should be valid', async () => {
    const consumption = await tibberQuery.getConsumption(EnergyResolution.HOURLY, 10, 'c70dcbe5-4485-4821-933d-a8a86452737b');
    expect(consumption).toBeDefined();
    expect(consumption.length).toEqual(10);
});

test('TibberQuery.getConsumption() should be valid', async () => {
    const consumption = await tibberQuery.getConsumption(EnergyResolution.HOURLY, 10);
    expect(consumption).toBeDefined();
    consumption.forEach(con => {
        const conObj = Object.assign([] as IConsumption[], con)
        expect(conObj.length).toEqual(10);
    });
});
