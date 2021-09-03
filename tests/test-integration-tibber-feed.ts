/* eslint-env mocha */
import { TibberFeed, IConfig } from '../src/index';
import WebSocket from 'ws';

const config: IConfig = {
    active: true,
    apiEndpoint: {
        apiKey: '476c477d8a039529478ebd690d35ddd80e3308ffc49b59c65b142321aee963a4', // Demo token
        feedUrl: 'wss://api.tibber.com/v1-beta/gql/subscriptions',
        queryUrl: 'https://api.tibber.com/v1-beta/gql',
    },
    homeId: 'cc83e83e-8cbf-4595-9bf7-c3cf192f7d9c',
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
    const feed = new TibberFeed(config);
    feed.on('connection_ack', (data: any) => {
        expect(data).toBeDefined();
        feed.close();
        done();
    });
    feed.connect();
}, 10000);

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
}, 10000);
