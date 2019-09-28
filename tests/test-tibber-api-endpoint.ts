/* eslint-env mocha */
import { UrlTools } from '../src/index';

const urlTools = new UrlTools();
test('Validate wss url should validate', () => {
    expect(urlTools.validateUrl('wss://api.tibber.com/v1-beta/gql/subscriptions')).toBe(true);
});
test('Validate https url should validate', () => {
    expect(urlTools.validateUrl('https://api.tibber.com/v1-beta/gql')).toBe(true);
});
test('Validate wss url should not validate', () => {
    expect(urlTools.validateUrl('wss//api.tibber.com/v1-beta/gql/subscriptions')).toBe(false);
});
test('Validate https url should not validate', () => {
    expect(urlTools.validateUrl('https//api.tibber.com/v1-beta/gql')).toBe(false);
});
