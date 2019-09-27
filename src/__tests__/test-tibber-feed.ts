/* eslint-env mocha */
import { TibberFeed } from '../index';
import WebSocket from 'ws';

let server: WebSocket.Server;

beforeAll(() => {
    server = new WebSocket.Server({ port: 1337 });
    server.on('connection', function(socket: any) {
        socket.on('message', function(msg: string) {
            let obj = JSON.parse(msg);
            if (obj.type == 'connection_init' && obj.payload == 'token=1337') {
                obj.type = 'connection_ack';
                socket.send(JSON.stringify(obj));
            } else if (
                obj.type == 'start' &&
                obj.payload.query.startsWith('subscription{liveMeasurement(homeId:"1337"){')
            ) {
                obj = {
                    type: 'data',
                    payload: { data: { liveMeasurement: { value: 1337 } } },
                };
                socket.send(JSON.stringify(obj));
            }
        });
        socket.on('close', function() {});
    });
});

afterAll(() => {
    if (server) {
        server.close();
        server = undefined;
    }
});

test('TibberFeed - Should be created', function() {
    expect(function() {
        let feed = new TibberFeed({
            apiEndpoint: {
                feedUrl: 'http://localhost:1337',
                apiKey: '1337',
            },
            homeId: '1337',
            active: true,
        });
        return feed;
    }).toBeDefined;
});

test('TibberFeed -should be connected', done => {
    let feed = new TibberFeed({
        apiEndpoint: {
            feedUrl: 'http://localhost:1337',
            apiKey: '1337',
        },
        homeId: '1337',
        active: true,
    });
    feed.on('connection_ack', function(data: any) {
        expect(data).toBeDefined();
        expect(data.payload).toBe('token=1337');
        feed.close();
        done();
    });
    feed.connect();
});

test('TibberFeed - Should receive data', done => {
    let feed = new TibberFeed({
        apiEndpoint: {
            feedUrl: 'http://localhost:1337',
            apiKey: '1337',
        },
        homeId: '1337',
        active: true,
    });
    feed.on('data', function(data) {
        expect(data).toBeDefined();
        expect(data.value).toBe(1337);
        feed.close();
        done();
    });
    feed.connect();
});

test('TibberFeed - Should be active', () => {
    let feed = new TibberFeed({
        apiEndpoint: {
            feedUrl: 'http://localhost:1337',
            apiKey: '1337',
        },
        homeId: '1337',
        active: true,
    });
    expect(feed.active).toBe(true);
});

test('TibberFeed - Should be inactive', function() {
    let feed = new TibberFeed({});
    expect(feed.active).toBe(false);
});

test('TibberFeed - Should timeout after 3 sec', done => {
    this.timeout(10000);
    let feed = new TibberFeed(
        {
            apiEndpoint: {
                feedUrl: 'http://localhost:1337',
                apiKey: '1337',
            },
            homeId: '1337',
            active: true,
        },
        3000,
    );
    let called = false;
    feed.on('connection_ack', function(data) {
        feed.heartbeat();
    });
    feed.on('disconnected', function(data) {
        expect(data).toBeDefined();
        if (!called) {
            called = true;
            feed.close();
            done();
        }
    });
    feed.connect();
});

test('TibberFeed - Should reconnect 5 times after 1 sec. timeout', done => {
    this.timeout(10000);
    let feed = new TibberFeed(
        {
            apiEndpoint: {
                feedUrl: 'http://localhost:1337',
                apiKey: '1337',
            },
            homeId: '1337',
            active: true,
        },
        1000,
    );
    let callCount = 0;
    feed.on('connection_ack', function(data) {
        expect(data).toBeDefined();
        expect(data.payload).toBe('token=1337');
        feed.heartbeat();
    });
    feed.on('disconnected', function(data) {
        expect(data).toBeDefined;
        if (callCount == 4) {
            done();
            feed.close();
        }
        callCount++;
    });
    feed.connect();
});
