/* eslint-env mocha */
import { TibberQuery } from '../src/index';
import nock from 'nock';

describe('Testing TibberQuery HTTP client', () => {

    beforeAll(() => { });
    afterAll(() => { });
    beforeEach(() => { });

    const tibberResponseHomes = { "viewer": { "homes": [{ "id": "c70dcbe5-4485-4821-933d-a8a86452737b", "address": { "address1": "Kungsgatan 8", "address2": null, "address3": null, "postalCode": "11759", "city": "Stockholm", "country": "SE", "latitude": "59.3362066", "longitude": "18.0675126" } }] } };

    it('Should return a valid home', async () => {
        const scope = nock('https://api.tibber.com')
            .post('/')
            .reply(200, tibberResponseHomes);
        const query = new TibberQuery({ endpoint: { apiKey: '1337', url: 'https://api.tibber.com' }, active: false });

        const res = await query.getHomes();
        expect(res).toMatchObject(tibberResponseHomes.viewer.homes);

    }, 60000);

    it('Should not crash when server returns an error', async () => {
        const scope = nock('https://api.tibber.com')
            .post('/')
            .reply(502, 'Bad Gateway');
        const query = new TibberQuery({ endpoint: { apiKey: '1337', url: 'https://api.tibber.com' }, active: false });

        expect(async () => {
            const res = await query.getHomes();
        }).rejects.toMatchObject({ httpCode: 502, responseMessage: 'Bad Gateway', statusCode: 502, statusMessage: null });

    }, 60000);
});
