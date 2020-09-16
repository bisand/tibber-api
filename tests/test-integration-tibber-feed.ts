/* eslint-env mocha */
import { TibberFeed, IConfig } from '../src/index';
import WebSocket from 'ws';

const config: IConfig = {
    active: true,
    apiEndpoint: {
        apiKey: 'd1007ead2dc84a2b82f0de19451c5fb22112f7ae11d19bf2bedb224a003ff74a', // Demo token
        feedUrl: 'wss://api.tibber.com/v1-beta/gql/subscriptions',
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
    },
    homeId: 'c70dcbe5-4485-4821-933d-a8a86452737b',
    timestamp: true,
    power: true,
    currentL1: true,
    currentL2: true,
    currentL3: true,
    signalStrength: true,
};

test('TibberFeed - Should be created', () => {
    expect(() => {
        const feed = new TibberFeed(config);
        return feed;
    }).toBeDefined();
});

test('TibberFeed -should be connected', done => {
    jest.setTimeout(10000);
    const feed = new TibberFeed(config);
    feed.on('connection_ack', (data: any) => {
        expect(data).toBeDefined();
        feed.close();
        done();
    });
    feed.connect();
});

test('TibberFeed - Should receive data', done => {
    jest.setTimeout(10000);
    const feed = new TibberFeed(config);
    feed.on('data', data => {
        expect(data).toBeDefined();
        feed.close();
        done();
    });
    feed.connect();
});
