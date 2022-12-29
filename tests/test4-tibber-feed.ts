/* eslint-env mocha */
import * as url from 'url';
import { IConfig, TibberFeed } from '../src/index';
import WebSocket from 'ws';
import { GQL } from '../src/nodes/models/GQL';
import { TibberQueryBase } from '../src/nodes/TibberQueryBase';

let server: WebSocket.Server;

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

beforeAll(() => {
    server = new WebSocket.Server({ port: 1337 });
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

afterAll(() => {
    if (server) {
        server.close();
        server.clients.forEach(ws => { ws.close() });
    }
});

test('TibberFeed - Should be created', () => {
    expect(() => {
        const query = new FakeTibberQuery({
            active: true,
            apiEndpoint: {
                apiKey: '1337',
                queryUrl: 'ws://localhost:1337',
                userAgent: 'test4-tibber-feed',
                requestTimeout: 5000,
            },
            homeId: '1337',
        });
        const feed = new TibberFeed(query);
        return feed;
    }).toBeDefined();
});

test('TibberFeed - should be connected', done => {
    const query = new FakeTibberQuery({
        active: true,
        apiEndpoint: {
            apiKey: '1337',
            queryUrl: 'ws://localhost:1337',
            userAgent: 'test4-tibber-feed',
            requestTimeout: 5000,
        },
        homeId: '1337',
    });
    const feed = new TibberFeed(query);
    feed.on(GQL.CONNECTION_ACK, (data: any) => {
        expect(data).toBeDefined();
        expect(data.payload?.token).toBe('1337');
        feed.close();
        done();
    });
    feed.connect();
});

test('TibberFeed - Should receive data', done => {
    const query = new FakeTibberQuery({
        active: true,
        apiEndpoint: {
            apiKey: '1337',
            queryUrl: 'ws://localhost:1337',
            userAgent: 'test4-tibber-feed',
            requestTimeout: 5000,
        },
        homeId: '1337',
    });
    const feed = new TibberFeed(query);
    feed.on('data', data => {
        expect(data).toBeDefined();
        expect(data.value).toBe(1337);
        feed.close();
    });
    feed.on('disconnected', data => {
        feed.active = false;
        done();
    });
    feed.connect();
});

test('TibberFeed - Should be active', () => {
    const query = new FakeTibberQuery({
        active: true,
        apiEndpoint: {
            apiKey: '1337',
            queryUrl: 'ws://localhost:1337',
            userAgent: 'test4-tibber-feed',
            requestTimeout: 5000,
        },
        homeId: '1337',
    });
    const feed = new TibberFeed(query);
    expect(feed.active).toBe(true);
});

test('TibberFeed - Should be inactive', () => {
    const query = new FakeTibberQuery({ active: false, apiEndpoint: { apiKey: '', queryUrl: '', userAgent: '' } });
    const feed = new TibberFeed(query);
    expect(feed.active).toBe(false);
});

test('TibberFeed - Should timeout after 3 sec', done => {
    const query = new FakeTibberQuery({
        active: true,
        apiEndpoint: {
            apiKey: '1337',
            queryUrl: 'ws://localhost:1337',
            userAgent: 'test4-tibber-feed',
            requestTimeout: 5000,
        },
        homeId: '1337',
    });
    const feed = new TibberFeed(query, 3000);
    let called = false;
    feed.on(GQL.CONNECTION_ACK, data => {
        feed.heartbeat();
    });
    feed.on('disconnected', data => {
        expect(data).toBeDefined();
        if (!called) {
            called = true;
            feed.active = false;
            done();
        }
    });
    feed.connect();
}, 10000);

test('TibberFeed - Should reconnect 5 times after 1 sec. timeout', done => {
    const query = new FakeTibberQuery({
        active: true,
        apiEndpoint: {
            apiKey: '1337',
            queryUrl: 'ws://localhost:1337',
            userAgent: 'test4-tibber-feed',
            requestTimeout: 5000,
        },
        homeId: '1337',
    });
    const feed = new TibberFeed(query, 1000);
    let callCount = 0;
    feed.on(GQL.CONNECTION_ACK, data => {
        expect(data).toBeDefined();
        expect(data.payload?.token).toBe('1337');
    });
    feed.on('heatbeat_timeout', data => {
        expect(data).toBeDefined();
        if (callCount === 4) {
            feed.active = false;
            done();
        }
        callCount++;
    });
    feed.on('heatbeat_reconnect', data => {
        expect(data).toBeDefined();
    });
    feed.connect();
}, 60000);
