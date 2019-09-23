/* eslint-env mocha */
let urlValidator = require('../nodes/tools').urlValidator;
let assert = require('assert');
describe('tibber-api-endpoint', function () {
  describe('Validate Url', function () {
    it('Websocket url should be valid', function () {
      let isValid = urlValidator("wss://api.tibber.com/v1-beta/gql/subscriptions");
      assert.ok(isValid);
    });
    it('Query url should be valid', function () {
      let isValid = urlValidator("https://api.tibber.com/v1-beta/gql");
      assert.ok(isValid);
    });
    it('Websocket url should be invalid', function () {
      let isValid = urlValidator("wss//api.tibber.com/v1-beta/gql/subscriptions");
      assert.ok(!isValid);
    });
    it('Query url should be invalid', function () {
      let isValid = urlValidator("https//api.tibber.com/v1-beta/gql");
      assert.ok(!isValid);
    });
  });
});
