/* eslint-env mocha */
const TibberFeed = require("../nodes/TibberFeed");
const assert = require("assert");
const WebSocket = require("ws");

describe("TibberFeed", function() {
  let server = undefined;

  before(function() {
    server = new WebSocket.Server({ port: 1337 });
    server.on("connection", function(socket) {
      socket.on("message", function(msg) {
        let obj = JSON.parse(msg);
        if (obj.type == "connection_init" && obj.payload == "token=1337") {
          obj.type = "connection_ack";
          socket.send(JSON.stringify(obj));
        } else if (
          obj.type == "start" &&
          obj.payload.query.startsWith(
            'subscription{liveMeasurement(homeId:"1337"){'
          )
        ) {
          obj = {
            type: "data",
            payload: { data: { liveMeasurement: { value: 1337 } } }
          };
          socket.send(JSON.stringify(obj));
        }
      });
      socket.on("close", function() {});
    });
  });

  after(function() {
    if (server) {
      server.close();
      server = null;
    }
  });

  describe("create", function() {
    it("Should be created", function() {
      let feed = new TibberFeed({
        apiEndpoint: {
          feedUrl: "http://localhost:1337",
          apiKey: "1337"
        },
        homeId: "1337",
        active: true
      });
      assert.ok(feed);
    });
  });

  describe("connect", function() {
    it("Should be connected", function(done) {
      let feed = new TibberFeed({
        apiEndpoint: {
          feedUrl: "http://localhost:1337",
          apiKey: "1337"
        },
        homeId: "1337",
        active: true
      });
      feed.on("connection_ack", function(data) {
        assert.ok(data);
        assert.equal(data.payload, "token=1337");
        feed.close();
        done();
      });
      feed.connect();
    });
  });

  describe("receive", function() {
    it("Should receive data", function(done) {
      let feed = new TibberFeed({
        apiEndpoint: {
          feedUrl: "http://localhost:1337",
          apiKey: "1337"
        },
        homeId: "1337",
        active: true
      });
      feed.on("data", function(data) {
        assert.ok(data);
        assert.equal(data.value, 1337);
        feed.close();
        done();
      });
      feed.connect();
    });
  });

  describe("active", function() {
    it("Should be active", function() {
      let feed = new TibberFeed({
        apiEndpoint: {
          feedUrl: "http://localhost:1337",
          apiKey: "1337"
        },
        homeId: "1337",
        active: true
      });
      assert.equal(feed.active, true);
    });
  });

  describe("inactive", function() {
    it("Should be inactive", function() {
      let feed = new TibberFeed({});
      assert.equal(feed.active, false);
    });
  });

  describe("timeout", function() {
    it("Should timeout after 3 sec", function(done) {
      this.timeout(10000);
      let feed = new TibberFeed(
        {
          apiEndpoint: {
            feedUrl: "http://localhost:1337",
            apiKey: "1337"
          },
          homeId: "1337",
          active: true
        },
        3000
      );
      let called = false;
      feed.on("connection_ack", function(data) {
        feed.heartbeat();
      });
      feed.on("disconnected", function(data) {
        assert.ok(data);
        if (!called) {
          called = true;
          feed.close();
          done();
        }
      });
      feed.connect();
    });
  });

  describe("reconnect", function() {
    it("Should reconnect 5 times after 1 sec. timeout", function(done) {
      this.timeout(10000);
      let feed = new TibberFeed(
        {
          apiEndpoint: {
            feedUrl: "http://localhost:1337",
            apiKey: "1337"
          },
          homeId: "1337",
          active: true
        },
        1000
      );
      let callCount = 0;
      feed.on("connection_ack", function(data) {
        assert.ok(data);
        assert.equal(data.payload, "token=1337");
        feed.heartbeat();
      });
      feed.on("disconnected", function(data) {
        assert.ok(data);
        if (callCount == 4) {
          done();
          feed.close();
        }
        callCount++;
      });
      feed.connect();
    });
  });
});
