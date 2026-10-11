import http from 'http';
import { AddressInfo } from 'net';
import { constants, createGzip } from 'zlib';
import { TibberData, TibberDataFeed, TibberOAuth, IDataLiveMeasurement, IDataStreamError } from '../src/index';

type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

let server: http.Server;
let apiUrl: string;
let handler: Handler;
const requests: http.IncomingMessage[] = [];

class TestTibberDataFeed extends TibberDataFeed {
    public delays: (string | number | undefined)[] = [];
    protected override getReconnectDelay(retryAfter?: string | number): number {
        this.delays.push(retryAfter);
        return 10;
    }
}

function sse(res: http.ServerResponse, event: string, data?: object) {
    res.write(`event: ${event}\ndata: ${data ? JSON.stringify(data) : ''}\n\n`);
}

function startStream(res: http.ServerResponse) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    sse(res, 'ping');
}

beforeAll(async () => {
    server = http.createServer((req, res) => {
        requests.push(req);
        handler(req, res);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    apiUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('Testing TibberDataFeed', () => {
    const feeds: TibberDataFeed[] = [];

    function createFeed(data?: TibberData, deviceIds: string[] = ['dev1', 'dev2']) {
        const feed = new TestTibberDataFeed(data ?? new TibberData({ accessToken: 'access', apiUrl }), 'home1', deviceIds);
        const errors: any[] = [];
        feed.on('error', (error) => errors.push(error));
        feeds.push(feed);
        return { feed, errors };
    }

    function next<T>(feed: TibberDataFeed, event: string): Promise<T> {
        return new Promise((resolve) => feed.once(event, resolve));
    }

    beforeEach(() => {
        requests.length = 0;
    });

    afterEach(() => {
        for (const feed of feeds) {
            feed.close();
            feed.removeAllListeners();
        }
        feeds.length = 0;
    });

    it('should require between 1 and 5 device IDs', () => {
        const data = new TibberData({ accessToken: 'access', apiUrl });
        expect(() => new TibberDataFeed(data, 'home1', [])).toThrow('Missing mandatory parameters');
        expect(() => new TibberDataFeed(data, 'home1', ['1', '2', '3', '4', '5', '6'])).toThrow('Missing mandatory parameters');
    });

    it('should connect and receive measurements', async () => {
        handler = (req, res) => {
            startStream(res);
            sse(res, 'measurement', { deviceId: 'dev1', power: 275 });
            // An event split over two chunks.
            res.write('event: measurement\ndata: {"deviceId":"dev2",');
            setTimeout(() => res.write('"power":280}\n\n'), 20);
        };
        const { feed } = createFeed();
        const received: IDataLiveMeasurement[] = [];
        const pinged = next(feed, 'ping');
        const done = new Promise<void>((resolve) => feed.on('data', (data) => { received.push(data); if (received.length === 2) resolve(); }));

        await feed.connect();
        await pinged;
        await done;

        expect(feed.connected).toBe(true);
        expect(received).toEqual([{ deviceId: 'dev1', power: 275 }, { deviceId: 'dev2', power: 280 }]);
        expect(requests[0].url).toBe('/v1/homes/home1/live-events?deviceId=dev1&deviceId=dev2');
        expect(requests[0].headers.authorization).toBe('Bearer access');
        expect(requests[0].headers.accept).toBe('text/event-stream');
        expect(requests[0].headers['accept-encoding']).toBe('gzip');
        expect(requests[0].headers['user-agent']).toContain('bisand/tibber-api/');
    });

    it('should read a gzip compressed stream', async () => {
        handler = (req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Content-Encoding': 'gzip' });
            const gzip = createGzip({ flush: constants.Z_SYNC_FLUSH });
            gzip.pipe(res);
            gzip.write(`event: measurement\ndata: ${JSON.stringify({ deviceId: 'dev1', power: 100 })}\n\n`);
        };
        const { feed } = createFeed();
        const data = next<IDataLiveMeasurement>(feed, 'data');

        await feed.connect();

        expect(await data).toEqual({ deviceId: 'dev1', power: 100 });
    });

    it('should not reconnect when evicted', async () => {
        handler = (req, res) => {
            startStream(res);
            sse(res, 'stream_error', { code: 'evicted', transient: false });
            res.end();
        };
        const { feed, errors } = createFeed();
        const streamError = next<IDataStreamError>(feed, 'stream_error');

        await feed.connect();

        expect(await streamError).toEqual({ code: 'evicted', transient: false });
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(requests).toHaveLength(1);
        expect(feed.active).toBe(false);
        expect(feed.connected).toBe(false);
        expect(errors[0]).toContain('evicted');
    });

    it('should reconnect after a transient stream error using retryAfter', async () => {
        handler = (req, res) => {
            startStream(res);
            if (requests.length === 1) {
                sse(res, 'stream_error', { code: 'upstream_unavailable', transient: true, retryAfter: 7 });
                res.end();
            } else {
                sse(res, 'measurement', { deviceId: 'dev1', power: 1 });
            }
        };
        const { feed } = createFeed();
        const data = next<IDataLiveMeasurement>(feed, 'data');

        await feed.connect();

        expect(await data).toEqual({ deviceId: 'dev1', power: 1 });
        expect(requests).toHaveLength(2);
        expect((feed as TestTibberDataFeed).delays).toEqual([7]);
    });

    it('should reconnect when the server closes the stream', async () => {
        handler = (req, res) => {
            startStream(res);
            if (requests.length === 1) {
                res.end();
            } else {
                sse(res, 'measurement', { deviceId: 'dev1', power: 2 });
            }
        };
        const { feed } = createFeed();
        const disconnected = next(feed, 'disconnected');
        const data = next<IDataLiveMeasurement>(feed, 'data');

        await feed.connect();
        await disconnected;

        expect(await data).toEqual({ deviceId: 'dev1', power: 2 });
        expect(requests).toHaveLength(2);
    });

    it('should reconnect on 503 and stop on 403', async () => {
        handler = (req, res) => {
            if (requests.length === 1) {
                res.writeHead(503, { 'Retry-After': '3' });
                res.end();
            } else {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ title: 'Forbidden', status: 403, detail: 'Missing scope' }));
            }
        };
        const { feed, errors } = createFeed();
        const error = next(feed, 'error');

        await feed.connect();
        await error;
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(requests).toHaveLength(2);
        expect((feed as TestTibberDataFeed).delays).toEqual(['3']);
        expect(errors[0]).toContain('Missing scope');
        expect(feed.active).toBe(false);
    });

    it('should refresh the access token once on 401', async () => {
        handler = (req, res) => {
            if (req.headers.authorization === 'Bearer new') {
                startStream(res);
                sse(res, 'measurement', { deviceId: 'dev1', power: 3 });
            } else {
                res.writeHead(401);
                res.end();
            }
        };
        const oauth = new TibberOAuth({ clientId: 'client', redirectUri: 'http://localhost:8787/callback' });
        jest.spyOn(oauth, 'refresh').mockResolvedValue({ accessToken: 'new', refreshToken: 'refresh' });
        const { feed } = createFeed(new TibberData({ tokens: { accessToken: 'old', refreshToken: 'refresh' }, oauth, apiUrl }));
        const data = next<IDataLiveMeasurement>(feed, 'data');

        await feed.connect();

        expect(await data).toEqual({ deviceId: 'dev1', power: 3 });
        expect(oauth.refresh).toHaveBeenCalledTimes(1);
        expect(requests).toHaveLength(2);
    });

    it('should stop on 401 when the token can not be refreshed', async () => {
        handler = (req, res) => {
            res.writeHead(401);
            res.end();
        };
        const { feed, errors } = createFeed();
        const error = next(feed, 'error');

        await feed.connect();
        await error;
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(requests).toHaveLength(2);
        expect(errors).toHaveLength(1);
        expect(feed.active).toBe(false);
    });

    it('should close the stream when closed', async () => {
        let closed: Promise<void> = Promise.resolve();
        handler = (req, res) => {
            closed = new Promise((resolve) => res.on('close', () => resolve()));
            startStream(res);
        };
        const { feed } = createFeed();
        const connected = next(feed, 'connected');
        const disconnected = next(feed, 'disconnected');

        await feed.connect();
        await connected;
        feed.close();
        await disconnected;
        await closed;
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(requests).toHaveLength(1);
        expect(feed.connected).toBe(false);
    });
});
