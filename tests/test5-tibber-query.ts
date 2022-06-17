/* eslint-env mocha */
import { TibberQuery } from '../src/index';
import { MockServer } from 'jest-mock-server';

const serverPort = 3001;

const config = {
    apiEndpoint: { queryUrl: 'https://localhost:' + serverPort, feedUrl: 'https://localhost', apiKey: '1337' },
    active: false,
};

describe('Testing TibberQuery HTTP client', () => {
    const server = new MockServer({ port: serverPort });
    const query = new TibberQuery(config);

    beforeAll(() => server.start());
    afterAll(() => server.stop());
    beforeEach(() => server.reset());

    it('Receives a status over the network', async () => {
        const route = server
            .get('/')
            // Look ma, plain Jest API!
            .mockImplementationOnce((ctx) => {
                // ...and plain Koa API
                ctx.status = 200;
            })
            .mockImplementationOnce((ctx) => {
                ctx.status = 201;
            });
        const url = server.getURL();
        const res = await query.getHomes();
        expect(res).toBeDefined();
    });
    test('TibberQuery should be created', () => {
        expect(query).toBeDefined();
    });
    test('TibberQuery Should be inactive', () => {
        expect(query.active).toBe(false);
    });
    test('TibberQuery Should be inactive', () => {
        query.active = true;
        expect(query.active).toBe(true);
    });
});
