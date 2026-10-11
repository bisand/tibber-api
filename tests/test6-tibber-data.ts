import nock from 'nock';
import { gzipSync } from 'zlib';
import { TibberData, TibberOAuth, DeviceHistoryResolution, TibberDataError, ITokenSet } from '../src/index';

const api = 'https://data-api.tibber.com';
const auth = 'https://thewall.tibber.com';

class TestTibberData extends TibberData {
    public delays: number[] = [];
    protected override sleep(ms: number): Promise<void> {
        this.delays.push(ms);
        return Promise.resolve();
    }
}

describe('Testing TibberOAuth', () => {
    const oauth = new TibberOAuth({ clientId: 'client', clientSecret: 'secret', redirectUri: 'http://localhost:8787/callback' });

    afterEach(() => {
        nock.cleanAll();
    });

    it('should require clientId and redirectUri', () => {
        expect(() => new TibberOAuth({ clientId: '', redirectUri: '' })).toThrow('Missing mandatory parameters');
    });

    it('should create an authorization URL with PKCE', () => {
        const { url, state, codeVerifier } = oauth.createAuthorizationUrl();
        const parsed = new URL(url);
        expect(parsed.origin + parsed.pathname).toBe('https://thewall.tibber.com/connect/authorize');
        expect(parsed.searchParams.get('response_type')).toBe('code');
        expect(parsed.searchParams.get('client_id')).toBe('client');
        expect(parsed.searchParams.get('redirect_uri')).toBe('http://localhost:8787/callback');
        expect(parsed.searchParams.get('scope')).toBe('openid profile email offline_access data-api-user-read data-api-homes-read');
        expect(parsed.searchParams.get('state')).toBe(state);
        expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
        expect(parsed.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(codeVerifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    });

    it('should create an authorization URL without PKCE', () => {
        const { url, state, codeVerifier } = oauth.createAuthorizationUrl({ state: 'abc', pkce: false });
        expect(state).toBe('abc');
        expect(codeVerifier).toBeUndefined();
        expect(new URL(url).searchParams.has('code_challenge')).toBe(false);
    });

    it('should exchange a code for tokens', async () => {
        let form: any;
        const scope = nock(auth)
            .post('/connect/token', (body: any) => { form = body; return true; })
            .reply(200, { access_token: 'access', refresh_token: 'refresh', expires_in: 3600, token_type: 'Bearer' });

        const before = Date.now();
        const tokens = await oauth.exchangeCode('code', 'verifier');
        scope.done();
        expect(form).toEqual({
            grant_type: 'authorization_code',
            code: 'code',
            redirect_uri: 'http://localhost:8787/callback',
            code_verifier: 'verifier',
            client_id: 'client',
            client_secret: 'secret',
        });
        expect(tokens).toMatchObject({ accessToken: 'access', refreshToken: 'refresh', tokenType: 'Bearer' });
        expect(tokens.expiresAt).toBeGreaterThanOrEqual(before + 3600000);
    });

    it('should keep the old refresh token when a refresh does not return a new one', async () => {
        const scope = nock(auth).post('/connect/token').reply(200, { access_token: 'access2', expires_in: 3600 });

        const tokens = await oauth.refresh('refresh');
        scope.done();
        expect(tokens).toMatchObject({ accessToken: 'access2', refreshToken: 'refresh' });
    });

    it('should reject when the token request fails', async () => {
        const scope = nock(auth).post('/connect/token').reply(400, { error: 'invalid_grant' });

        await expect(oauth.exchangeCode('code')).rejects.toMatchObject({ name: 'TibberDataError', status: 400, body: { error: 'invalid_grant' } });
        scope.done();
    });
});

describe('Testing TibberData', () => {
    afterEach(() => {
        nock.cleanAll();
    });

    it('should require an access token', () => {
        expect(() => new TibberData({})).toThrow('Missing mandatory parameter');
    });

    it('should return homes and send the access token', async () => {
        const scope = nock(api, { reqheaders: { authorization: 'Bearer access', 'user-agent': /bisand\/tibber-api\// } })
            .get('/v1/homes')
            .reply(200, { homes: [{ id: 'home1', name: 'Home' }] });

        const data = new TibberData({ accessToken: 'access' });
        expect(await data.getHomes()).toEqual([{ id: 'home1', name: 'Home' }]);
        scope.done();
    });

    it('should return devices, a device and live event devices', async () => {
        const item = { id: 'dev1', externalId: 'ext1', info: { name: 'Car', brand: 'Brand' }, supportedHistory: { resolutions: ['hour'] } };
        const device = { ...item, status: {}, attributes: [], capabilities: [{ id: 'storage.stateOfCharge', description: 'SoC', value: 80, unit: '%' }] };
        const scope = nock(api)
            .get('/v1/homes/home1/devices').reply(200, { devices: [item] })
            .get('/v1/homes/home1/devices/dev1').reply(200, device)
            .get('/v1/homes/home1/live-events/devices').reply(200, { devices: [{ id: 'live1', type: 'tibber pulse' }] });

        const data = new TibberData({ accessToken: 'access' });
        expect(await data.getDevices('home1')).toEqual([item]);
        expect(await data.getDevice('home1', 'dev1')).toEqual(device);
        expect(await data.getLiveEventDevices('home1')).toEqual([{ id: 'live1', type: 'tibber pulse' }]);
        scope.done();
    });

    it('should return device history and follow page links', async () => {
        const page1 = { query: { resolution: 'hour' }, items: [{ time: 'a', data: {} }], next: 'https://data-api.tibber.com/v1/homes/home1/devices/dev1/history?cursor=abc' };
        const page2 = { query: { resolution: 'hour' }, items: [{ time: 'b', data: {} }] };
        const scope = nock(api)
            .get('/v1/homes/home1/devices/dev1/history').query({ resolution: 'hour', since: '2026-10-01T00:00:00.000Z' }).reply(200, page1)
            .get('/v1/homes/home1/devices/dev1/history').query({ cursor: 'abc' }).reply(200, page2);

        const data = new TibberData({ accessToken: 'access' });
        const first = await data.getDeviceHistory('home1', 'dev1', { resolution: DeviceHistoryResolution.HOUR, since: new Date('2026-10-01T00:00:00.000Z') });
        expect(first).toEqual(page1);
        expect(await data.getDeviceHistoryPage(first.next as string)).toEqual(page2);
        scope.done();
    });

    it('should not send the access token to another host', async () => {
        const data = new TibberData({ accessToken: 'access' });
        await expect(data.getDeviceHistoryPage('https://example.com/v1/homes')).rejects.toThrow('Refusing to send access token');
    });

    it('should retry on 429 and 5xx and honour Retry-After', async () => {
        const scope = nock(api)
            .get('/v1/homes').reply(429, {}, { 'Retry-After': '2' })
            .get('/v1/homes').reply(503)
            .get('/v1/homes').reply(200, { homes: [] });

        const data = new TestTibberData({ accessToken: 'access' });
        expect(await data.getHomes()).toEqual([]);
        scope.done();
        expect(data.delays).toHaveLength(2);
        expect(data.delays[0]).toBeGreaterThanOrEqual(2000);
        expect(data.delays[0]).toBeLessThanOrEqual(2250);
        expect(data.delays[1]).toBeLessThanOrEqual(800);
    });

    it('should give up after the maximum number of retries', async () => {
        const scope = nock(api).get('/v1/homes').times(3).reply(503);

        const data = new TestTibberData({ accessToken: 'access', maxRetries: 2 });
        await expect(data.getHomes()).rejects.toMatchObject({ name: 'TibberDataError', status: 503 });
        scope.done();
        expect(data.delays).toHaveLength(2);
    });

    it('should not retry on 404', async () => {
        const scope = nock(api).get('/v1/homes/home1/devices').reply(404, { title: 'Not Found', status: 404, detail: 'Home not found' });

        const data = new TestTibberData({ accessToken: 'access' });
        const error: TibberDataError = await data.getDevices('home1').catch((e) => e);
        scope.done();
        expect(error).toBeInstanceOf(TibberDataError);
        expect(error.status).toBe(404);
        expect(error.message).toContain('Home not found');
        expect(data.delays).toHaveLength(0);
    });

    it('should refresh an expired access token before the request', async () => {
        const authScope = nock(auth).post('/connect/token').reply(200, { access_token: 'new', refresh_token: 'refresh2', expires_in: 3600 });
        const scope = nock(api, { reqheaders: { authorization: 'Bearer new' } }).get('/v1/homes').times(2).reply(200, { homes: [] });

        const saved: ITokenSet[] = [];
        const data = new TibberData({
            tokens: { accessToken: 'old', refreshToken: 'refresh', expiresAt: Date.now() - 1000 },
            oauth: new TibberOAuth({ clientId: 'client', redirectUri: 'http://localhost:8787/callback' }),
            onTokensRefreshed: (tokens) => { saved.push(tokens); },
        });
        // Concurrent requests share one refresh.
        await Promise.all([data.getHomes(), data.getHomes()]);
        authScope.done();
        scope.done();
        expect(saved).toHaveLength(1);
        expect(saved[0]).toMatchObject({ accessToken: 'new', refreshToken: 'refresh2' });
        expect(data.tokens?.accessToken).toBe('new');
    });

    it('should refresh the access token once on 401', async () => {
        const authScope = nock(auth).post('/connect/token').reply(200, { access_token: 'new', expires_in: 3600 });
        const scope = nock(api)
            .get('/v1/homes').matchHeader('authorization', 'Bearer old').reply(401)
            .get('/v1/homes').matchHeader('authorization', 'Bearer new').reply(200, { homes: [] });

        const data = new TibberData({
            tokens: { accessToken: 'old', refreshToken: 'refresh' },
            oauth: new TibberOAuth({ clientId: 'client', redirectUri: 'http://localhost:8787/callback' }),
        });
        expect(await data.getHomes()).toEqual([]);
        authScope.done();
        scope.done();
    });

    it('should reject on 401 when the token can not be refreshed', async () => {
        const scope = nock(api).get('/v1/homes').reply(401);

        const data = new TibberData({ accessToken: 'access' });
        await expect(data.getHomes()).rejects.toMatchObject({ status: 401 });
        scope.done();
    });

    it('should decompress gzip responses', async () => {
        const scope = nock(api, { reqheaders: { 'accept-encoding': 'gzip' } })
            .get('/v1/homes')
            .reply(200, gzipSync(JSON.stringify({ homes: [{ id: 'home1', name: 'Home' }] })), { 'Content-Encoding': 'gzip', 'Content-Type': 'application/json' });

        const data = new TibberData({ accessToken: 'access' });
        expect(await data.getHomes()).toEqual([{ id: 'home1', name: 'Home' }]);
        scope.done();
    });
});
