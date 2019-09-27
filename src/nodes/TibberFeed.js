"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var events_1 = require("events");
var ws_1 = require("ws");
var TibberFeed = /** @class */ (function (_super) {
    __extends(TibberFeed, _super);
    function TibberFeed(config, timeout) {
        if (timeout === void 0) { timeout = 30000; }
        var _this = _super.call(this) || this;
        var node = _this;
        node._timeout = timeout;
        node._config = config;
        node._active = config.active;
        node._hearbeatTimeouts = [];
        node._isConnected = false;
        if (!config.apiEndpoint || !config.apiEndpoint.apiKey || !config.homeId || !config.apiEndpoint.feedUrl) {
            node._active = false;
            config.active = false;
            node.warn('Missing mandatory parameters. Execution will halt.');
            return _this;
        }
        var _gql = 'subscription{liveMeasurement(homeId:"' + node._config.homeId + '"){';
        if (node._config.timestamp) {
            _gql += 'timestamp ';
        }
        if (node._config.power) {
            _gql += 'power ';
        }
        if (node._config.lastMeterConsumption) {
            _gql += 'lastMeterConsumption ';
        }
        if (node._config.accumulatedConsumption) {
            _gql += 'accumulatedConsumption ';
        }
        if (node._config.accumulatedProduction) {
            _gql += 'accumulatedProduction ';
        }
        if (node._config.accumulatedCost) {
            _gql += 'accumulatedCost ';
        }
        if (node._config.accumulatedReward) {
            _gql += 'accumulatedReward ';
        }
        if (node._config.currency) {
            _gql += 'currency ';
        }
        if (node._config.minPower) {
            _gql += 'minPower ';
        }
        if (node._config.averagePower) {
            _gql += 'averagePower ';
        }
        if (node._config.maxPower) {
            _gql += 'maxPower ';
        }
        if (node._config.powerProduction) {
            _gql += 'powerProduction ';
        }
        if (node._config.minPowerProduction) {
            _gql += 'minPowerProduction ';
        }
        if (node._config.maxPowerProduction) {
            _gql += 'maxPowerProduction ';
        }
        if (node._config.lastMeterProduction) {
            _gql += 'lastMeterProduction ';
        }
        if (node._config.powerFactor) {
            _gql += 'powerFactor ';
        }
        if (node._config.voltagePhase1) {
            _gql += 'voltagePhase1 ';
        }
        if (node._config.voltagePhase2) {
            _gql += 'voltagePhase2 ';
        }
        if (node._config.voltagePhase3) {
            _gql += 'voltagePhase3 ';
        }
        if (node._config.currentPhase1) {
            _gql += 'currentPhase1 ';
        }
        if (node._config.currentPhase2) {
            _gql += 'currentPhase2 ';
        }
        if (node._config.currentPhase3) {
            _gql += 'currentPhase3 ';
        }
        _gql += '}}';
        node._query = {
            id: '1',
            payload: {
                extensions: {},
                operationName: null,
                query: _gql,
                variables: {}
            },
            type: 'start'
        };
        return _this;
    }
    Object.defineProperty(TibberFeed.prototype, "active", {
        get: function () {
            return this._active;
        },
        set: function (active) {
            if (active === this._active) {
                return;
            }
            this._active = active;
            if (this._active) {
                this.connect();
            }
            else {
                this.close();
            }
        },
        enumerable: true,
        configurable: true
    });
    TibberFeed.prototype.connect = function () {
        var node = this;
        node._webSocket = new ws_1["default"](String(node._config.apiEndpoint.feedUrl), ['graphql-ws']);
        node._webSocket.on('open', function () {
            if (!node._webSocket) {
                return;
            }
            node._webSocket.send('{"type":"connection_init","payload":"token=' + node._config.apiEndpoint.apiKey + '"}');
            node.emit('connected', 'Connected to Tibber feed.');
        });
        node._webSocket.on('message', function (message) {
            if (message.startsWith('{')) {
                var msg = JSON.parse(message);
                if (msg.type === 'connection_ack') {
                    node._isConnected = true;
                    node.emit('connection_ack', msg);
                    var str = JSON.stringify(node._query);
                    if (node._webSocket) {
                        node._webSocket.send(str);
                    }
                }
                else if (msg.type === 'connection_error') {
                    node.error(msg);
                    node.close();
                }
                else if (msg.type === 'data') {
                    if (!msg.payload.data) {
                        return;
                    }
                    var data = msg.payload.data.liveMeasurement;
                    node.emit('data', data);
                }
            }
        });
        node._webSocket.on('close', function () {
            node._isConnected = false;
            node.emit('disconnected', 'Disconnected from Tibber feed');
        });
        node._webSocket.on('error', function (error) {
            node.error(error);
        });
    };
    TibberFeed.prototype.close = function () {
        var node = this;
        node._hearbeatTimeouts.forEach(function (timeout) {
            clearTimeout(timeout);
        });
        if (node._webSocket) {
            if (node._isConnected) {
                node._webSocket.close();
            }
        }
        node.log('Closed Tibber Feed.');
    };
    TibberFeed.prototype.heartbeat = function () {
        var node = this;
        for (var i = 0; i < node._hearbeatTimeouts.length; i++) {
            var timeout = node._hearbeatTimeouts[i];
            clearTimeout(timeout);
            node._hearbeatTimeouts.shift();
            i--;
        }
        node._hearbeatTimeouts.push(setTimeout(function () {
            if (node._webSocket) {
                node._webSocket.terminate();
                node.warn('Connection timed out after ' + node._timeout + ' ms. Reconnecting...');
                node.connect();
            }
        }, node._timeout));
    };
    TibberFeed.prototype.log = function (message) {
        try {
            this.emit('log', message);
        }
        catch (error) {
            console.error(error);
        }
    };
    TibberFeed.prototype.warn = function (message) {
        try {
            this.emit('warn', message);
        }
        catch (error) {
            console.error(error);
        }
    };
    TibberFeed.prototype.error = function (message) {
        try {
            this.emit('error', message);
        }
        catch (error) {
            console.error(error);
        }
    };
    return TibberFeed;
}(events_1.EventEmitter));
exports.TibberFeed = TibberFeed;
