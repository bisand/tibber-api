import WebSocket from 'ws';
import { Config } from '../models/config';
import { EventEmitter } from 'events';

export class TibberFeed extends EventEmitter {
    _timeout!: number;
    _config!: Config;
    _active!: boolean;
    _hearbeatTimeouts!: NodeJS.Timeout[];
    _isConnected!: boolean;
    _query!: {
        id: string;
        type: string;
        payload: {
            variables: {};
            extensions: {};
            operationName: null;
            query: string;
        };
    };
    _webSocket!: WebSocket;

    constructor(config: Config, timeout = 30000) {

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
        if (node._config.timestamp)
            _gql += 'timestamp ';
        if (node._config.power)
            _gql += 'power ';
        if (node._config.lastMeterConsumption)
            _gql += 'lastMeterConsumption ';
        if (node._config.accumulatedConsumption)
            _gql += 'accumulatedConsumption ';
        if (node._config.accumulatedProduction)
            _gql += 'accumulatedProduction ';
        if (node._config.accumulatedCost)
            _gql += 'accumulatedCost ';
        if (node._config.accumulatedReward)
            _gql += 'accumulatedReward ';
        if (node._config.currency)
            _gql += 'currency ';
        if (node._config.minPower)
            _gql += 'minPower ';
        if (node._config.averagePower)
            _gql += 'averagePower ';
        if (node._config.maxPower)
            _gql += 'maxPower ';
        if (node._config.powerProduction)
            _gql += 'powerProduction ';
        if (node._config.minPowerProduction)
            _gql += 'minPowerProduction ';
        if (node._config.maxPowerProduction)
            _gql += 'maxPowerProduction ';
        if (node._config.lastMeterProduction)
            _gql += 'lastMeterProduction ';
        if (node._config.powerFactor)
            _gql += 'powerFactor ';
        if (node._config.voltagePhase1)
            _gql += 'voltagePhase1 ';
        if (node._config.voltagePhase2)
            _gql += 'voltagePhase2 ';
        if (node._config.voltagePhase3)
            _gql += 'voltagePhase3 ';
        if (node._config.currentPhase1)
            _gql += 'currentPhase1 ';
        if (node._config.currentPhase2)
            _gql += 'currentPhase2 ';
        if (node._config.currentPhase3)
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

        node._webSocket.on('message', function (message: string) {
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
                    let data = msg.payload.data.liveMeasurement;
                    node.emit('data', data);
                }
            }
        });

        node._webSocket.on('close', function () {
            node._isConnected = false;
            node.emit('disconnected', "Disconnected from Tibber feed");
        });

        node._webSocket.on('error', function (error: any) {
            node.error(error);
        });
    }

    close() {
        var node = this;
        node._hearbeatTimeouts.forEach((timeout: NodeJS.Timeout) => {
            clearTimeout(timeout);
        });
        if (node._webSocket) {
            if (node._isConnected) {
                node._webSocket.close();
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
                node.warn('Connection timed out after ' + node._timeout + ' ms. Reconnecting...');
                node.connect();
            }
        }, node._timeout));
    }

    log(message: string) {
        try {
            this.emit('log', message);
        } catch (error) {
            console.error(error);
        }
    }

    warn(message: string) {
        try {
            this.emit('warn', message);
        } catch (error) {
            console.error(error);
        }
    }

    error(message: any) {
        try {
            this.emit('error', message);
        } catch (error) {
            console.error(error);
        }
    }
}

module.exports = TibberFeed;