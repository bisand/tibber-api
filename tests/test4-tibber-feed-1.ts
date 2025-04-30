/* eslint-env mocha */
import * as url from 'url';
import { IConfig, TibberFeed } from '../src/index';
import WebSocket, { WebSocketServer } from 'ws';
import { GQL } from '../src/nodes/models/GQL';
import { TibberQueryBase } from '../src/nodes/TibberQueryBase';

let server: WebSocketServer;

export class FakeTibberQuery extends TibberQueryBase {
    /**
     * Constructor
     * Create an instace of TibberQuery class
     * @param config IConfig object
     * @see IConfig
     */
    constructor(config: IConfig) {
        super(config);
    }

    public override async getWebsocketSubscriptionUrl(): Promise<url.URL> {
        return new url.URL(this.config.apiEndpoint.queryUrl);
    }

    public override async getRealTimeEnabled(homeId: string): Promise<boolean> {
        return true;
    }

}

beforeAll(async () => {
    server = new WebSocketServer({ port: 1337 });
    server.on('connection', socket => {
        socket.on('message', (msg: string) => {
            let obj = JSON.parse(msg);
            if (obj.type === GQL.CONNECTION_INIT && obj.payload?.token === '1337') {
                obj.type = GQL.CONNECTION_ACK;
                socket.send(JSON.stringify(obj));
            } else if (obj.type === GQL.SUBSCRIBE
                && obj.payload.query
                && obj.payload.query.startsWith('subscription($homeId:ID!){liveMeasurement(homeId:$homeId){')
                && obj.payload.variables
                && obj.payload.variables.homeId === '1337') {
                obj = {
                    id: obj.id,
                    payload: { data: { liveMeasurement: { value: 1337 } } },
                    type: GQL.NEXT,
                };
                socket.send(JSON.stringify(obj));
            }
        });
        socket.on('close', () => {
            return;
        });
    });
});

afterAll(async () => {
    if (server) {
        // Close all client sockets first
        for (const ws of server.clients) {
            ws.terminate(); // terminate is safer for test cleanup
        }
        // Wait for server to close
        await new Promise<void>(resolve => server.close(() => resolve()));
    }
});

const feeds: TibberFeed[] = [];

afterEach(() => {
    for (const feed of feeds) {
        feed.active = false;
        feed.close();
        feed.removeAllListeners();
    }
    feeds.length = 0;
});

test('TibberFeed - should be connected', done => {
    const query = new FakeTibberQuery({
        active: true,
        apiEndpoint: {
            apiKey: '1337',
            queryUrl: 'ws://localhost:1337',
            userAgent: 'test4-tibber-feed',
        },
        homeId: '1337',
    });
    const feed = new TibberFeed(query, 30000, true, 5000);
    feeds.push(feed);
    feed.on(GQL.CONNECTION_ACK, (data: any) => {
        expect(data).toBeDefined();
        expect(data.payload?.token).toBe('1337');
        feed.active = false;
        done();
    });
    feed.on('heartbeat_timeout', data => {
        // console.log('heartbeat_timeout -> TibberFeed - should be connected');
    });
    feed.on('connection_timeout', data => {
        // console.log('connection_timeout -> TibberFeed - should be connected');
    });
    feed.connect();
}, 60000);

test('TibberFeed - Should receive data', done => {
    (async done => {
        const query = new FakeTibberQuery({
            active: true,
            apiEndpoint: {
                apiKey: '1337',
                queryUrl: 'ws://localhost:1337',
                userAgent: 'test4-tibber-feed',
            },
            homeId: '1337',
        });
        const feed = new TibberFeed(query);
        feeds.push(feed);
        feed.on('data', data => {
            expect(data).toBeDefined();
            expect(data.value).toBe(1337);
            feed.close();
        });
        feed.on('disconnected', data => {
            feed.active = false;
            feed.close();
            done();
        });
        feed.on('heartbeat_timeout', data => {
            // console.log('heartbeat_timeout -> TibberFeed - Should receive data');
        });
        await feed.connect();
    })(done);
});

test('TibberFeed - Should be active', () => {
    const query = new FakeTibberQuery({
        active: true,
        apiEndpoint: {
            apiKey: '1337',
            queryUrl: 'ws://localhost:1337',
            userAgent: 'test4-tibber-feed',
        },
        homeId: '1337',
    });
    const feed = new TibberFeed(query);
    feeds.push(feed);
    feed.on('heartbeat_timeout', data => {
        // console.log('heartbeat_timeout -> TibberFeed - Should be active');
    });
    expect(feed.active).toBe(true);
    feed.active = false;
    feed.close();
});

test('TibberFeed - Should be inactive', () => {
    const query = new FakeTibberQuery({ active: false, apiEndpoint: { apiKey: '', queryUrl: '', userAgent: '' } });
    const feed = new TibberFeed(query);
    feeds.push(feed);
    feed.on('heartbeat_timeout', data => {
        // console.log('heartbeat_timeout -> TibberFeed - should be inactive');
    });
    expect(feed.active).toBe(false);
    feed.active = false;
    feed.close();
});

test('TibberFeed - Should timeout after 3 sec', done => {
    const query = new FakeTibberQuery({
        active: true,
        apiEndpoint: {
            apiKey: '1337',
            queryUrl: 'ws://localhost:1337',
            userAgent: 'test4-tibber-feed',
        },
        homeId: '1337',
    });
    const feed = new TibberFeed(query, 3000);
    feeds.push(feed);
    let called = false;
    feed.on(GQL.CONNECTION_ACK, data => {
        // feed.heartbeat();
    });
    feed.on('heartbeat_timeout', data => {
        // console.log('heartbeat_timeout -> TibberFeed - Should timeout after 3 sec');
    });
    feed.on('disconnected', data => {
        expect(data).toBeDefined();
        if (!called) {
            called = true;
            feed.active = false;
            feed.close();
            done();
        }
    });
    feed.connect();
}, 10000);

test('TibberFeed - Should reconnect 3 times after 5 sec. timeout', done => {
    const query = new FakeTibberQuery({
        active: true,
        apiEndpoint: {
            apiKey: '1337',
            queryUrl: 'ws://localhost:1337',
            userAgent: 'test4-tibber-feed',
        },
        homeId: '1337',
    });
    const feed = new TibberFeed(query, 5000);
    feeds.push(feed);
    const maxRetry = 3;
    let timeoutCount = 0;
    let reconnectCount = 0;
    feed.on(GQL.CONNECTION_ACK, data => {
        expect(data).toBeDefined();
        expect(data.payload?.token).toBe('1337');
    });
    feed.on('heartbeat_timeout', data => {
        timeoutCount++;
        expect(data).toBeDefined();
        // console.log('heartbeat_timeout -> TibberFeed - Should reconnect 3 times after 5 sec. timeout', Date.now().toLocaleString(), data);
    });
    feed.on('heartbeat_reconnect', data => {
        reconnectCount++;
        expect(data).toBeDefined();
        if (timeoutCount === maxRetry && reconnectCount == maxRetry) {
            feed.active = false;
            done();
        }
        // console.log('heartbeat_reconnect -> TibberFeed - Should reconnect 3 times after 5 sec. timeout', Date.now().toLocaleString(), data);
    });
    feed.connect();
}, 60000);
