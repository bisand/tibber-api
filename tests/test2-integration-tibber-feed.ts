/* eslint-env mocha */
import { TibberFeed, IConfig, TibberQuery } from '../src/index';

const config: IConfig = {
    active: true,
    apiEndpoint: {
        apiKey: '3A77EECF61BD445F47241A5A36202185C35AF3AF58609E19B53F3A8872AD7BE1-1', // Demo token
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
        userAgent: 'test2-integration-tibber-feed',
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
        const feed = new TibberFeed(query);
        return feed;
    }).toBeDefined();
});

/*
test('TibberFeed -should be connected', done => {
    const query = new TibberQuery(config);
    const feed = new TibberFeed(query);
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
    const query = new TibberQuery(config);
    const feed = new TibberFeed(query);
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
