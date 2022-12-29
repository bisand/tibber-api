/* eslint-env mocha */
import { TibberQuery, IConfig } from '../src/index';
import { EnergyResolution } from '../src/models/enums/EnergyResolution';
import { IConsumption } from '../src/models/IConsumption';
import { AppScreen } from '../src/models/enums/AppScreen';
import { ISendPushNotification } from '../src/models/ISendPushNotification';
import { UrlTools } from '../src/index';

const config: IConfig = {
    active: false,
    apiEndpoint: {
        apiKey: '5K4MVS-OjfWhK_4yrjOlFe1F6kJXPVf7eQYggo8ebAE', // Demo token
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
    },
};

let tibberQuery: TibberQuery;

beforeAll(() => {
    tibberQuery = new TibberQuery(config);
});

afterAll(async () => {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 500)); // avoid jest open handle error
});

afterEach(async () => {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 500)); // avoid jest open handle error
});

test('TibberQuery.getWebsocketSubscriptionUrl() should be valid', async () => {
    const url = await tibberQuery.getWebsocketSubscriptionUrl();
    expect(url).toBeDefined();
    const urlTools = new UrlTools();
    expect(urlTools.validateUrl(url.href)).toBe(true);
}, 30000);

test('TibberQuery.getHomes() should be valid', async () => {
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
}, 30000);

test('TibberQuery.getHomesComplete() should be valid', async () => {
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
}, 30000);

test('TibberQuery.getConsumption() with homeId should be valid', async () => {
    const consumption = await tibberQuery.getConsumption(EnergyResolution.HOURLY, 10, '96a14971-525a-4420-aae9-e5aedaa129ff');
    expect(consumption).toBeDefined();
    expect(consumption.length).toEqual(10);
}, 30000);

test('TibberQuery.getConsumption() should be valid', async () => {
    const consumption = await tibberQuery.getConsumption(EnergyResolution.HOURLY, 10);
    expect(consumption).toBeDefined();
    consumption.forEach((con) => {
        const conObj = Object.assign([] as IConsumption[], con);
        expect(conObj.length).toEqual(10);
    });
}, 30000);

test('TibberQuery.getCurrentEnergyPrice() should be valid', async () => {
    const price = await tibberQuery.getCurrentEnergyPrice('96a14971-525a-4420-aae9-e5aedaa129ff');
    expect(price).toBeDefined();
}, 30000);

test('TibberQuery.getCurrentEnergyPrices() should be valid', async () => {
    const prices = await tibberQuery.getCurrentEnergyPrices();
    expect(prices).toBeDefined();
    expect(prices.length).toBeGreaterThan(0);
    prices.forEach((price) => {
        expect(price.total).toBeGreaterThan(0);
    });
}, 30000);

test('TibberQuery.getCurrentEnergyPrices() should be valid', async () => {
    const prices = await tibberQuery.getCurrentEnergyPrices();
    expect(prices).toBeDefined();
    expect(prices.length).toBeGreaterThan(0);
    prices.forEach((price) => {
        expect(price.total).toBeGreaterThan(0);
    });
}, 30000);

test('TibberQuery.getTodaysEnergyPrices() should be valid', async () => {
    const prices = await tibberQuery.getTodaysEnergyPrices('96a14971-525a-4420-aae9-e5aedaa129ff');
    expect(prices).toBeDefined();
    expect(prices.length).toBeGreaterThan(0);
    prices.forEach((price) => {
        expect(price.total).toBeGreaterThan(0);
    });
}, 30000);

test('TibberQuery.getTomorrowsEnergyPrices() should be valid', async () => {
    const prices = await tibberQuery.getTomorrowsEnergyPrices('96a14971-525a-4420-aae9-e5aedaa129ff');
    expect(prices).toBeDefined();
    if (prices.length) {
        prices.forEach((price) => {
            expect(price.total).toBeGreaterThan(0);
        });
    }
}, 30000);

test('TibberQuery.sendPushNotification() should return error when using demo user', async () => {
    const message = 'TEST_MESSAGE';
    const title = 'TEST_TITLE';
    const screenToOpen = AppScreen.HOME;

    process.nextTick(() => { });
    const result: ISendPushNotification = await tibberQuery.sendPushNotification(title, message, screenToOpen);
    if (result.errors != undefined) result.errors.map((m) => expect(m.message).toContain('operation not allowed for demo user'));
}, 30000);
