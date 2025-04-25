import nock from 'nock';
import { TibberFeed } from '../src';
import { FakeTibberQuery } from './test4-tibber-feed-1';

function createFakeWebSocket(): any {
    return {
        onopen: undefined,
        onmessage: undefined,
        onerror: undefined,
        onclose: undefined,
        send: jest.fn(),
        close: jest.fn()
    };
}

describe('Testing TibberFeed ', () => {

    beforeAll(() => { })
    afterAll(() => {
        nock.restore()
    })
    beforeEach(() => { })
    afterEach(() => {
        jest.clearAllTimers?.();
        jest.clearAllMocks();
    })

    const mockQuery = new FakeTibberQuery({
        active: true,
        apiEndpoint: {
            apiKey: '1337',
            queryUrl: 'ws://localhost:1337',
            userAgent: 'test4-tibber-feed',
        },
        homeId: '1337',
    });
    it('should throw if apiKey is missing', async () => {
        const queryMissingKey = new FakeTibberQuery({
            active: true,
            apiEndpoint: {
                apiKey: '',
                queryUrl: 'ws://localhost:1337',
                userAgent: 'test4-tibber-feed',
            },
            homeId: '1337',
        });
        const connector = new TibberFeed(queryMissingKey, 30000, true, 5000);

        await expect((connector as any).internalConnect()).rejects.toThrow('Missing mandatory parameters');
    });

    it('should call getWebsocketSubscriptionUrl()', async () => {
        const mockQuery = new FakeTibberQuery({
            active: true,
            apiEndpoint: {
                apiKey: '1337',
                queryUrl: 'ws://localhost:1337',
                userAgent: 'test4-tibber-feed',
            },
            homeId: '1337',
        });
        jest.spyOn(mockQuery, 'getWebsocketSubscriptionUrl').mockResolvedValue(new URL('wss://example.com/'));

        const factory = jest.fn().mockReturnValue(createFakeWebSocket());

        const connector = new TibberFeed(mockQuery, 30000, true, 5000);
        connector['_webSocketFactory'] = factory;

        await (connector as any).internalConnect();

        expect(mockQuery.getWebsocketSubscriptionUrl).toHaveBeenCalled();
        expect(factory).toHaveBeenCalledWith(
            'wss://example.com/',
            ['graphql-transport-ws'],
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });

    it('should attach WebSocket event handlers', async () => {
        const wsMock = createFakeWebSocket();
        const factory = jest.fn().mockReturnValue(wsMock);

        const connector = new TibberFeed(mockQuery, 30000, true, 5000);
        connector['_webSocketFactory'] = factory;

        const open = jest.fn(), msg = jest.fn(), err = jest.fn(), close = jest.fn();

        // Use public event registration methods if available, e.g. 'on' or 'addEventListener'
        if (typeof (connector as any).on === 'function') {
            (connector as any).on('open', open);
            (connector as any).on('message', msg);
            (connector as any).on('error', err);
            (connector as any).on('close', close);
        } else {
            // fallback for test: skip handler assignment if not possible
        }

        await (connector as any).internalConnect();

        expect(wsMock.onopen).toBeInstanceOf(Function);
        expect(wsMock.onmessage).toBeInstanceOf(Function);
        expect(wsMock.onerror).toBeInstanceOf(Function);
        expect(wsMock.onclose).toBeInstanceOf(Function);
    });

});
