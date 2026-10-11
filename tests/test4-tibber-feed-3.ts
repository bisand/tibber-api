import * as url from 'url';
import { IConfig, TibberFeed } from '../src/index';
import { GQL } from '../src/nodes/models/GQL';
import { TibberQueryBase } from '../src/nodes/TibberQueryBase';

const config: IConfig = {
    active: true,
    apiEndpoint: {
        apiKey: '1337',
        queryUrl: 'ws://localhost:1337',
        userAgent: 'test4-tibber-feed',
    },
    homeId: '1337',
};

class StubTibberQuery extends TibberQueryBase {
    public realTimeEnabled: jest.Mock = jest.fn().mockResolvedValue(true);

    constructor() {
        super(config);
    }

    public override async getWebsocketSubscriptionUrl(): Promise<url.URL> {
        return new url.URL(this.config.apiEndpoint.queryUrl);
    }

    public override async getRealTimeEnabled(homeId: string): Promise<boolean> {
        return this.realTimeEnabled(homeId);
    }
}

function createFakeWebSocket(): any {
    return {
        readyState: 0,
        send: jest.fn(),
        close: jest.fn(),
        terminate: jest.fn(),
    };
}

describe('Testing TibberFeed reconnect behaviour', () => {
    const feeds: TibberFeed[] = [];

    function createFeed(query: TibberQueryBase, factory?: jest.Mock): { feed: TibberFeed; errors: any[] } {
        const feed = new TibberFeed(query, 60000, true, 30000, false, factory);
        const errors: any[] = [];
        feed.on('error', error => errors.push(error));
        feeds.push(feed);
        return { feed, errors };
    }

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        for (const feed of feeds) {
            feed.active = false;
            feed.removeAllListeners();
        }
        feeds.length = 0;
        jest.useRealTimers();
    });

    it('should back off exponentially when the real-time check keeps failing', async () => {
        const query = new StubTibberQuery();
        query.realTimeEnabled.mockRejectedValue({ httpCode: 503 });
        const { feed } = createFeed(query);

        await feed.connect();
        await jest.advanceTimersByTimeAsync(60000);

        // Delays double from 1-2 s, so one minute fits 5 or 6 attempts.
        expect(query.realTimeEnabled.mock.calls.length).toBeGreaterThanOrEqual(4);
        expect(query.realTimeEnabled.mock.calls.length).toBeLessThanOrEqual(6);
    });

    it('should stop retrying when the token is rejected by the API', async () => {
        const query = new StubTibberQuery();
        query.realTimeEnabled.mockRejectedValue({ httpCode: 200, errors: [{ message: 'invalid token', extensions: { code: 'UNAUTHENTICATED' } }] });
        const { feed, errors } = createFeed(query);

        await feed.connect();
        await jest.advanceTimersByTimeAsync(10 * 60000);

        expect(query.realTimeEnabled).toHaveBeenCalledTimes(1);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('Unauthenticated');

        // An explicit connect tries again.
        await feed.connect();
        await jest.advanceTimersByTimeAsync(1000);
        expect(query.realTimeEnabled).toHaveBeenCalledTimes(2);
    });

    it('should stop retrying when the websocket is closed with an invalid token code', async () => {
        const ws = createFakeWebSocket();
        const factory = jest.fn().mockReturnValue(ws);
        const { feed, errors } = createFeed(new StubTibberQuery(), factory);

        await feed.connect();
        await jest.advanceTimersByTimeAsync(1000);
        expect(factory).toHaveBeenCalledTimes(1);

        ws.onclose({ code: 4403, reason: 'Invalid token' });
        await jest.advanceTimersByTimeAsync(10 * 60000);

        expect(factory).toHaveBeenCalledTimes(1);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('Unauthenticated');
    });

    it('should not open a second websocket while waiting for connection_ack', async () => {
        const ws = createFakeWebSocket();
        const factory = jest.fn().mockReturnValue(ws);
        const { feed } = createFeed(new StubTibberQuery(), factory);

        await feed.connect();
        await jest.advanceTimersByTimeAsync(20000);

        expect(factory).toHaveBeenCalledTimes(1);
        expect(feed.connected).toBe(false);

        ws.onmessage({ data: JSON.stringify({ type: GQL.CONNECTION_ACK }) });
        await jest.advanceTimersByTimeAsync(20000);

        expect(feed.connected).toBe(true);
        expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should terminate the websocket and retry when connection_ack never arrives', async () => {
        const first = createFakeWebSocket();
        const second = createFakeWebSocket();
        const factory = jest.fn().mockReturnValueOnce(first).mockReturnValue(second);
        const { feed } = createFeed(new StubTibberQuery(), factory);

        await feed.connect();
        await jest.advanceTimersByTimeAsync(40000);

        expect(first.terminate).toHaveBeenCalled();
        expect(factory).toHaveBeenCalledTimes(2);
    });
});
