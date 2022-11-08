/* eslint-env mocha */
import { TibberFeed, IConfig, TibberQuery } from '../src/index';

const config: IConfig = {
    active: true,
    apiEndpoint: {
        apiKey: '5K4MVS-OjfWhK_4yrjOlFe1F6kJXPVf7eQYggo8ebAE', // Demo token
        feedUrl: 'wss://api.tibber.com/v1-beta/gql/subscriptions',
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
    },
    homeId: '96a14971-525a-4420-aae9-e5aedaa129ff',
    timestamp: true,
    power: true,
    currentL1: true,
    currentL2: true,
    currentL3: true,
    signalStrength: true,
};

test('TibberFeed - Should be created', () => {
    expect(async () => {
        const query = new TibberQuery(config);
        const url = await query.getWebsocketSubscriptionUrl();
        config.apiEndpoint.feedUrl = url.toString();
        const feed = new TibberFeed(config);
        return feed;
    }).toBeDefined();
});

/*
test('TibberFeed -should be connected', done => {
    const feed = new TibberFeed(config);
    feed.on(GQL.CONNECTION_ACK, (data: any) => {
        expect(data).toBeDefined();
        feed.close();
        done();
    });
    feed.connect();
}, 30000);
*/

/*
test('TibberFeed - Should receive data', done => {
    const feed = new TibberFeed(config);
    feed.on('data', data => {
        expect(data).toBeDefined();
        feed.close();
        done();
    });
    feed.on('error', error => {
        console.error(error);
        throw new Error(error);
    });
    feed.connect();
}, 30000);
*/
