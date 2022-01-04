/* eslint-env mocha */
import { TibberFeed } from '../src/index';
import WebSocket from 'ws';

let server: WebSocket.Server;

beforeAll(() => {
    server = new WebSocket.Server({ port: 1337 });
    server.on('connection', socket => {
        socket.on('message', (msg: string) => {
            let obj = JSON.parse(msg);
            if (obj.type === 'connection_init' && obj.payload.token === '1337') {
                obj.type = 'connection_ack';
                socket.send(JSON.stringify(obj));
            } else if (obj.type === 'start' && obj.payload.query.startsWith('subscription{liveMeasurement(homeId:"1337"){')) {
                obj = {
                    payload: { data: { liveMeasurement: { value: 1337 } } },
                    type: 'data',
                };
                socket.send(JSON.stringify(obj));
            }
        });
        socket.on('close', () => {
            return;
        });
    });
});

afterAll(() => {
    if (server) {
        server.close();
        // server = undefined;
    }
});

test('TibberFeed - Should be created', () => {
    expect(() => {
        const feed = new TibberFeed({
            active: true,
            apiEndpoint: {
                apiKey: '1337',
                feedUrl: 'ws://localhost:1337',
                queryUrl: '',
            },
            homeId: '1337',
        });
        return feed;
    }).toBeDefined();
});

test('TibberFeed - should be connected', done => {
    const feed = new TibberFeed({
        active: true,
        apiEndpoint: {
            apiKey: '1337',
            feedUrl: 'ws://localhost:1337',
            queryUrl: '',
        },
        homeId: '1337',
    });
    feed.on('connection_ack', (data: any) => {
        expect(data).toBeDefined();
        expect(data.payload.token).toBe('1337');
        feed.close();
        done();
    });
    feed.connect();
});

test('TibberFeed - Should receive data', done => {
    const feed = new TibberFeed({
        active: true,
        apiEndpoint: {
            apiKey: '1337',
            feedUrl: 'ws://localhost:1337',
            queryUrl: '',
        },
        homeId: '1337',
    });
    feed.on('data', data => {
        expect(data).toBeDefined();
        expect(data.value).toBe(1337);
        feed.close();
        done();
    });
    feed.connect();
});

test('TibberFeed - Should be active', () => {
    const feed = new TibberFeed({
        active: true,
        apiEndpoint: {
            apiKey: '1337',
            feedUrl: 'ws://localhost:1337',
            queryUrl: '',
        },
        homeId: '1337',
    });
    expect(feed.active).toBe(true);
});

test('TibberFeed - Should be inactive', () => {
    const feed = new TibberFeed({ active: false, apiEndpoint: { apiKey: '', feedUrl: '', queryUrl: '' } });
    expect(feed.active).toBe(false);
});

test('TibberFeed - Should timeout after 3 sec', done => {
    const feed = new TibberFeed(
        {
            active: true,
            apiEndpoint: {
                apiKey: '1337',
                feedUrl: 'ws://localhost:1337',
                queryUrl: '',
            },
            homeId: '1337',
        },
        3000,
    );
    let called = false;
    feed.on('connection_ack', data => {
        feed.heartbeat();
    });
    feed.on('disconnected', data => {
        expect(data).toBeDefined();
        if (!called) {
            called = true;
            feed.close();
            done();
        }
    });
    feed.connect();
}, 10000);

test('TibberFeed - Should reconnect 5 times after 1 sec. timeout', done => {
    const feed = new TibberFeed(
        {
            active: true,
            apiEndpoint: {
                apiKey: '1337',
                feedUrl: 'ws://localhost:1337',
                queryUrl: '',
            },
            homeId: '1337',
        },
        1000,
    );
    let callCount = 0;
    feed.on('connection_ack', data => {
        expect(data).toBeDefined();
        expect(data.payload.token).toBe('1337');
        feed.heartbeat();
    });
    feed.on('disconnected', data => {
        expect(data).toBeDefined();
        if (callCount === 4) {
            done();
            feed.close();
        }
        callCount++;
    });
    feed.connect();
}, 10000);
