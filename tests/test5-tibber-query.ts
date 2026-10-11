/* eslint-env mocha */
import { TibberQuery } from '../src/index'
import nock from 'nock'
import { EnergyResolution } from '../src/models/enums/EnergyResolution'

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

    it('Should reject when server returns HTTP 200 with errors and no data', async () => {
        const errors = [{ message: 'invalid token', path: ['viewer'], extensions: { code: 'UNAUTHENTICATED' } }]
        const scope = nock('https://api.tibber.com')
            .post(/.*/)
            .reply(200, { errors, data: null }, { 'Content-Type': 'application/json' })

        const query = new TibberQuery({ apiEndpoint: { apiKey: 'invalid', queryUrl: 'https://api.tibber.com' }, active: false })

        await expect(query.getHomes()).rejects.toMatchObject({ httpCode: 200, errors })
        scope.done()
    }, 60000)

    it('Should return a flat list of consumption for all homes', async () => {
        const response = {
            data: {
                viewer: {
                    homes: [
                        { id: 'home1', consumption: { nodes: [{ from: 'a', consumption: 1 }, { from: 'b', consumption: 2 }] } },
                        { id: 'home2', consumption: null },
                        { id: 'home3', consumption: { nodes: [{ from: 'c', consumption: 3 }] } },
                    ],
                },
            },
        }
        const scope = nock('https://api.tibber.com')
            .post(/.*/)
            .reply(200, response, { 'Content-Type': 'application/json' })

        const query = new TibberQuery({ apiEndpoint: { apiKey: '1337', queryUrl: 'https://api.tibber.com' }, active: false })

        const res = await query.getConsumption(EnergyResolution.HOURLY, 2)
        scope.done()
        expect(res).toEqual([
            { homeId: 'home1', from: 'a', consumption: 1 },
            { homeId: 'home1', from: 'b', consumption: 2 },
            { homeId: 'home3', from: 'c', consumption: 3 },
        ])
    }, 60000)

    it('Should skip homes without a current price', async () => {
        const response = {
            data: {
                viewer: {
                    homes: [
                        { id: 'home1', currentSubscription: { priceInfo: { current: { total: 1.5 } } } },
                        { id: 'home2', currentSubscription: null },
                    ],
                },
            },
        }
        const scope = nock('https://api.tibber.com')
            .post(/.*/)
            .reply(200, response, { 'Content-Type': 'application/json' })

        const query = new TibberQuery({ apiEndpoint: { apiKey: '1337', queryUrl: 'https://api.tibber.com' }, active: false })

        const res = await query.getCurrentEnergyPrices()
        scope.done()
        expect(res).toEqual([{ homeId: 'home1', total: 1.5 }])
    }, 60000)
})
