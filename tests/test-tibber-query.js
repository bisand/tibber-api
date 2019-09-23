/* eslint-env mocha */
let TibberQuery = require("../nodes/TibberQuery");
let assert = require("assert");
describe("TibberQuery", function() {
  describe("create", function() {
    it("Should be created", function() {
      let query = new TibberQuery({
        apiEndpoint: { queryUrl: "https://test.com", apiKey: "1337" },
        active: false
      });
      assert.ok(query);
    });
  });
  describe("inactive", function() {
    it("Should be inactive", function() {
      let query = new TibberQuery({
        apiEndpoint: { queryUrl: "https://test.com", apiKey: "1337" },
        active: false
      });
      assert.equal(query.active, false);
    });
  });
});
