const WebSocket = require('ws');
const EventEmitter = require('events').EventEmitter;

class TibberFeed extends EventEmitter {

    constructor(config, timeout = 30000) {
        
        super();

        var node = this;
        node._timeout = timeout;
        node._config = config;
        node._active = config.active;
        node._hearbeatTimeouts = [];
        node._isConnected = false;

        if (!config.apiEndpoint || !config.apiEndpoint.apiKey || !config.homeId || !config.apiEndpoint.feedUrl) {
            node._active = false;
            config.active = false;
            node.warn('Missing mandatory parameters. Execution will halt.')
            return;
        }

        var _gql = 'subscription{liveMeasurement(homeId:"' + node._config.homeId + '"){';
        if (node._config.timestamp == 1)
            _gql += 'timestamp ';
        if (node._config.power == 1)
            _gql += 'power ';
        if (node._config.lastMeterConsumption == 1)
            _gql += 'lastMeterConsumption ';
        if (node._config.accumulatedConsumption == 1)
            _gql += 'accumulatedConsumption ';
        if (node._config.accumulatedProduction == 1)
            _gql += 'accumulatedProduction ';
        if (node._config.accumulatedCost == 1)
            _gql += 'accumulatedCost ';
        if (node._config.accumulatedReward == 1)
            _gql += 'accumulatedReward ';
        if (node._config.currency == 1)
            _gql += 'currency ';
        if (node._config.minPower == 1)
            _gql += 'minPower ';
        if (node._config.averagePower == 1)
            _gql += 'averagePower ';
        if (node._config.maxPower == 1)
            _gql += 'maxPower ';
        if (node._config.powerProduction == 1)
            _gql += 'powerProduction ';
        if (node._config.minPowerProduction == 1)
            _gql += 'minPowerProduction ';
        if (node._config.maxPowerProduction == 1)
            _gql += 'maxPowerProduction ';
        if (node._config.lastMeterProduction == 1)
            _gql += 'lastMeterProduction ';
        if (node._config.powerFactor == 1)
            _gql += 'powerFactor ';
        if (node._config.voltagePhase1 == 1)
            _gql += 'voltagePhase1 ';
        if (node._config.voltagePhase2 == 1)
            _gql += 'voltagePhase2 ';
        if (node._config.voltagePhase3 == 1)
            _gql += 'voltagePhase3 ';
        if (node._config.currentPhase1 == 1)
            _gql += 'currentPhase1 ';
        if (node._config.currentPhase2 == 1)
            _gql += 'currentPhase2 ';
        if (node._config.currentPhase3 == 1)
            _gql += 'currentPhase3 ';
        _gql += '}}';
        node._query = {
            id: "1",
            type: "start",
            payload: {
                variables: {},
                extensions: {},
                operationName: null,
                query: _gql
            }
        };
    }

    get active() {
        return this._active;
    }

    set active(active) {
        if (active == this._active)
            return;
        this._active = active;
        if (this._active)
            this.connect();
        else
            this.close();
    }

    connect() {
        var node = this;
        node._webSocket = new WebSocket(node._config.apiEndpoint.feedUrl, ['graphql-ws']);

        node._webSocket.on('open', function () {
            if (!node._webSocket)
                return;
            node._webSocket.send('{"type":"connection_init","payload":"token=' + node._config.apiEndpoint.apiKey + '"}');
            node.emit('connected', "Connected to Tibber feed.");
        });

        node._webSocket.on('message', function (message) {
            if (message.startsWith('{')) {
                var msg = JSON.parse(message);
                if (msg.type == 'connection_ack') {
                    node._isConnected = true;
                    node.emit('connection_ack', msg);
                    var str = JSON.stringify(node._query);
                    if (node._webSocket)
                        node._webSocket.send(str);
                } else if (msg.type == "connection_error") {
                    node.error(msg);
                    node.close();
                } else if (msg.type == "data") {
                    if (!msg.payload.data)
                        return;
                    var data = msg.payload.data.liveMeasurement;
                    node.emit('data', data);
                }
            }
        });

        node._webSocket.on('close', function () {
            node._isConnected = false;
            node.emit('disconnected', "Disconnected from Tibber feed");
        });

        node._webSocket.on('error', function (error) {
            node.error(error);
        });
    }

    close() {
        var node = this;
        node._hearbeatTimeouts.forEach(timeout => {
            clearTimeout(timeout);
        });
        if (node._webSocket) {
            if (node._isConnected) {
                node._webSocket.close();
                node._webSocket = null;
            }
        }
        node.log('Closed Tibber Feed.');
    }

    heartbeat() {
        var node = this;
        for (var i = 0; i < node._hearbeatTimeouts.length; i++) {
            var timeout = node._hearbeatTimeouts[i];
            clearTimeout(timeout);
            node._hearbeatTimeouts.shift()
            i--;
        }
        node._hearbeatTimeouts.push(setTimeout(() => {
            if (node._webSocket) {
                node._webSocket.terminate();
                node._webSocket = null;
                node.warn('Connection timed out after ' + node._timeout + ' ms. Reconnecting...');
                node.connect();
            }
        }, node._timeout));
    }

    log(message) {
        try {
            this.emit('log', message);
        } catch (error) {
            console.error(error);
        }
    }

    warn(message) {
        try {
            this.emit('warn', message);
        } catch (error) {
            console.error(error);
        }
    }

    error(message) {
        try {
            this.emit('error', message);
        } catch (error) {
            console.error(error);
        }
    }
}

module.exports = TibberFeed;