/* eslint-env mocha */
import { TibberQuery } from '../index';

const config = {
    apiEndpoint: { queryUrl: 'https://test.com', apiKey: '1337' },
    active: false,
};

const query = new TibberQuery(config);

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
