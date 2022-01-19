/* eslint-env mocha */
import { TibberQuery, IConfig } from '../src/index';
import { EnergyResolution } from '../src/models/enums/EnergyResolution';
import { IConsumption } from '../src/models/IConsumption';
import { AppScreen } from '../src/models/enums/AppScreen';
import { ISendPushNotification } from '../src/models/ISendPushNotification';

const config: IConfig = {
    active: false,
    apiEndpoint: {
        apiKey: '476c477d8a039529478ebd690d35ddd80e3308ffc49b59c65b142321aee963a4', // Demo token
        feedUrl: 'wss://api.tibber.com/v1-beta/gql/subscriptions',
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
    },
};

afterAll(async () => {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 500)); // avoid jest open handle error
});

test('TibberQuery.getHomes() should be valid', async () => {
    const tibberQuery = new TibberQuery(config);
    process.nextTick(() => {});
    const homes = await tibberQuery.getHomes();
    expect(homes).toBeDefined();
    expect(homes.length).toBeGreaterThan(0);
    homes.forEach((home) => {
        expect(home).toBeDefined();
        expect(home.address).toBeDefined();
        expect(home.owner).toBeDefined();
        expect(home.meteringPointData).toBeDefined();
        expect(home.features).toBeDefined();
    });
});

test('TibberQuery.getHomesComplete() should be valid', async () => {
    const tibberQuery = new TibberQuery(config);
    process.nextTick(() => {});
    const homes = await tibberQuery.getHomesComplete();
    expect(homes).toBeDefined();
    expect(homes.length).toBeGreaterThan(0);
    homes.forEach((home) => {
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
    const tibberQuery = new TibberQuery(config);
    process.nextTick(() => {});
    const consumption = await tibberQuery.getConsumption(EnergyResolution.HOURLY, 10, 'cc83e83e-8cbf-4595-9bf7-c3cf192f7d9c');
    expect(consumption).toBeDefined();
    expect(consumption.length).toEqual(10);
});

test('TibberQuery.getConsumption() should be valid', async () => {
    const tibberQuery = new TibberQuery(config);
    process.nextTick(() => {});
    const consumption = await tibberQuery.getConsumption(EnergyResolution.HOURLY, 10);
    expect(consumption).toBeDefined();
    consumption.forEach((con) => {
        const conObj = Object.assign([] as IConsumption[], con);
        expect(conObj.length).toEqual(10);
    });
});

test('TibberQuery.getCurrentEnergyPrice() should be valid', async () => {
    const tibberQuery = new TibberQuery(config);
    process.nextTick(() => {});
    const price = await tibberQuery.getCurrentEnergyPrice('cc83e83e-8cbf-4595-9bf7-c3cf192f7d9c');
    expect(price).toBeDefined();
});

test('TibberQuery.getCurrentEnergyPrices() should be valid', async () => {
    const tibberQuery = new TibberQuery(config);
    process.nextTick(() => {});
    const prices = await tibberQuery.getCurrentEnergyPrices();
    expect(prices).toBeDefined();
    expect(prices.length).toBeGreaterThan(0);
    prices.forEach((price) => {
        expect(price.total).toBeGreaterThan(0);
    });
});

test('TibberQuery.getCurrentEnergyPrices() should be valid', async () => {
    const tibberQuery = new TibberQuery(config);
    process.nextTick(() => {});
    const prices = await tibberQuery.getCurrentEnergyPrices();
    expect(prices).toBeDefined();
    expect(prices.length).toBeGreaterThan(0);
    prices.forEach((price) => {
        expect(price.total).toBeGreaterThan(0);
    });
});

test('TibberQuery.getTodaysEnergyPrices() should be valid', async () => {
    const tibberQuery = new TibberQuery(config);
    process.nextTick(() => {});
    const prices = await tibberQuery.getTodaysEnergyPrices('cc83e83e-8cbf-4595-9bf7-c3cf192f7d9c');
    expect(prices).toBeDefined();
    expect(prices.length).toBeGreaterThan(0);
    prices.forEach((price) => {
        expect(price.total).toBeGreaterThan(0);
    });
});

test('TibberQuery.getTomorrowsEnergyPrices() should be valid', async () => {
    const tibberQuery = new TibberQuery(config);
    process.nextTick(() => {});
    const prices = await tibberQuery.getTomorrowsEnergyPrices('cc83e83e-8cbf-4595-9bf7-c3cf192f7d9c');
    expect(prices).toBeDefined();
    if (prices.length) {
        prices.forEach((price) => {
            expect(price.total).toBeGreaterThan(0);
        });
    }
});

test('TibberQuery.sendPushNotification() should return error when using demo user', async () => {
    const tibberQuery = new TibberQuery(config);
    const message = 'TEST_MESSAGE';
    const title = 'TEST_TITLE';
    const screenToOpen = AppScreen.HOME;

    process.nextTick(() => {});
    const result: ISendPushNotification = await tibberQuery.sendPushNotification(title, message, screenToOpen);
    if (result.errors != undefined) result.errors.map((m) => expect(m.message).toContain('operation not allowed for demo user'));
});
