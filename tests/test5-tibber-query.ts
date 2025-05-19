/* eslint-env mocha */
import { TibberQuery } from '../src/index'
import nock from 'nock'

describe('Testing TibberQuery HTTP client', () => {

    beforeAll(() => { })
    afterAll(() => {
        nock.restore()
    })
    beforeEach(() => { })
    afterEach(() => {
        jest.clearAllTimers();
    })
    const tibberResponseHomes = { "viewer": { "homes": [{ "id": "c70dcbe5-4485-4821-933d-a8a86452737b", "address": { "address1": "Kungsgatan 8", "address2": null, "address3": null, "postalCode": "11759", "city": "Stockholm", "country": "SE", "latitude": "59.3362066", "longitude": "18.0675126" } }] } }

    it('Should return a valid home', async () => {
        const scope = nock('https://api.tibber.com')
            .post(/.*/) // Match any POST path
            .reply(200, tibberResponseHomes, { 'Content-Type': 'application/json' })

        const query = new TibberQuery({ apiEndpoint: { apiKey: '1337', queryUrl: 'https://api.tibber.com' }, active: false })

        const res = await query.getHomes()
        scope.done()
        expect(res).toMatchObject(tibberResponseHomes.viewer.homes)

    }, 60000)

    it('Should not crash when server returns an error', async () => {
        const scope = nock('https://api.tibber.com')
            .post(/.*/) // Match any POST path
            .reply(502, 'Bad Gateway')

        // Ensure nock is enabled and intercepting
        expect(nock.isActive()).toBe(true);

        const query = new TibberQuery({
            apiEndpoint: { apiKey: '1337', queryUrl: 'https://api.tibber.com' },
            active: false,
        });

        await expect(query.getHomes()).rejects.toMatchObject({
            httpCode: 502,
            responseMessage: 'Bad Gateway',
            statusCode: 502,
            statusMessage: 'Bad Gateway'
        });

        scope.done();
    }, 60000)
})
