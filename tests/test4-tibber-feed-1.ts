/* eslint-env mocha */
import * as url from 'url';
import { IConfig, TibberFeed } from '../src/index';
import { WebSocketServer } from 'ws';
import { GQL } from '../src/nodes/models/GQL';
import { TibberQueryBase } from '../src/nodes/TibberQueryBase';

let server: WebSocketServer;
let serverPort: number;

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
    // Use port 0 to let the system assign an available port
    server = new WebSocketServer({ port: 0 });
    
    // Wait for server to be listening and get the assigned port
    await new Promise<void>((resolve) => {
        server.on('listening', () => {
            const address = server.address();
            if (address && typeof address === 'object') {
                serverPort = address.port;
            }
            resolve();
        });
    });
    
    server.on('connection', socket => {
        let heartbeatInterval: NodeJS.Timeout | null = null;
        
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
                
                // Send initial data
                obj = {
                    id: obj.id,
                    payload: { data: { liveMeasurement: { value: 1337 } } },
                    type: GQL.NEXT,
                };
                socket.send(JSON.stringify(obj));
                
                // For the reconnection test, we want to simulate no heartbeat data
                // This will cause the TibberFeed to timeout and reconnect
                // We intentionally DON'T send periodic data to trigger timeouts
            }
        });
        
        socket.on('close', () => {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
        });
    });
});

afterAll(async () => {
    if (server) {
        // Close all client sockets first
        for (const ws of server.clients) {
            ws.terminate(); // terminate is safer for test cleanup
        }
        // Wait for server to close with a timeout
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Server close timeout'));
            }, 5000);
            
            server.close((err) => {
                clearTimeout(timeout);
                if (err) reject(err);
                else resolve();
            });
        }).catch(err => {
            console.warn('Server close error (ignoring):', err.message);
        });
        
        // Additional cleanup
        server.removeAllListeners();
    }
});

const feeds: TibberFeed[] = [];

afterEach(async () => {
    // Clean up feeds with proper waiting
    const cleanupPromises = feeds.map(feed => {
        return new Promise<void>((resolve) => {
            feed.active = false;
            feed.close();
            feed.removeAllListeners();
            // Give feeds a moment to clean up properly
            setTimeout(resolve, 100);
        });
    });
    
    await Promise.all(cleanupPromises);
    feeds.length = 0;
});

test('TibberFeed - should be connected', done => {
    const query = new FakeTibberQuery({
        active: true,
        apiEndpoint: {
            apiKey: '1337',
            queryUrl: `ws://localhost:${serverPort}`,
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
                queryUrl: `ws://localhost:${serverPort}`,
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
            queryUrl: `ws://localhost:${serverPort}`,
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
            queryUrl: `ws://localhost:${serverPort}`,
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
            queryUrl: `ws://localhost:${serverPort}`,
            userAgent: 'test4-tibber-feed',
        },
        homeId: '1337',
    });
    const feed = new TibberFeed(query, 5000);
    feeds.push(feed);
    const maxRetry = 3;
    let timeoutCount = 0;
    let reconnectCount = 0;
    
    // Add a safety timeout to prevent hanging
    const safetyTimeout = setTimeout(() => {
        console.log(`Test safety timeout reached. timeoutCount: ${timeoutCount}, reconnectCount: ${reconnectCount}`);
        feed.active = false;
        done(new Error(`Test did not complete within safety timeout. timeoutCount: ${timeoutCount}, reconnectCount: ${reconnectCount}`));
    }, 50000); // 50 seconds, less than Jest timeout
    
    feed.on(GQL.CONNECTION_ACK, data => {
        expect(data).toBeDefined();
        expect(data.payload?.token).toBe('1337');
        // Manually start heartbeat after connection to trigger timeout/reconnect cycle
        setTimeout(() => feed.heartbeat(), 100);
    });
    feed.on('heartbeat_timeout', data => {
        timeoutCount++;
        expect(data).toBeDefined();
    });
    feed.on('heartbeat_reconnect', data => {
        reconnectCount++;
        expect(data).toBeDefined();
        if (timeoutCount >= maxRetry && reconnectCount >= maxRetry) {
            clearTimeout(safetyTimeout);
            feed.active = false;
            done();
        }
    });
    feed.on('error', (error) => {
        clearTimeout(safetyTimeout);
        feed.active = false;
        done(error);
    });
    feed.connect();
}, 60000);
