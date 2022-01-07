import { EventEmitter } from 'events';
import { IConfig } from '../models/IConfig';
import { IQuery } from '../models/IQuery';
import { IQueryPayload } from "../models/IQueryPayload";
import WebSocket from 'ws';

export class TibberFeed extends EventEmitter {
    private static _operationId: number = 0;

    private _timeout: number;
    private _config: IConfig;
    private _active: boolean;
    private _hearbeatTimeouts: NodeJS.Timeout[];
    private _isConnected: boolean;
    private _isConnecting: boolean;
    private _gql: string;
    private _webSocket!: WebSocket;
    /**
     * Constructor for creating a new instance if TibberFeed.
     * @param config IConfig object
     * @param timeout Reconnection timeout
     * @see IConfig
     */
    constructor(config: IConfig, timeout: number = 30000, returnAllFields = false) {
        super();

        const node = this;
        this._timeout = timeout;
        this._config = config;
        this._active = config.active;
        this._hearbeatTimeouts = [];
        this._isConnected = false;
        this._isConnecting = false;
        this._gql = '';

        if (!config.apiEndpoint || !config.apiEndpoint.apiKey || !config.homeId || !config.apiEndpoint.feedUrl) {
            node._active = false;
            config.active = false;
            node.warn('Missing mandatory parameters. Execution will halt.');
            return;
        }

        this._gql = 'subscription{liveMeasurement(homeId:"' + node._config.homeId + '"){';
        if (node._config.timestamp || returnAllFields) {
            this._gql += 'timestamp ';
        }
        if (node._config.power || returnAllFields) {
            this._gql += 'power ';
        }
        if (node._config.lastMeterConsumption || returnAllFields) {
            this._gql += 'lastMeterConsumption ';
        }
        if (node._config.accumulatedConsumption || returnAllFields) {
            this._gql += 'accumulatedConsumption ';
        }
        if (node._config.accumulatedProduction || returnAllFields) {
            this._gql += 'accumulatedProduction ';
        }
        if (node._config.accumulatedConsumptionLastHour || returnAllFields) {
            this._gql += 'accumulatedConsumptionLastHour ';
        }
        if (node._config.accumulatedProductionLastHour || returnAllFields) {
            this._gql += 'accumulatedProductionLastHour ';
        }
        if (node._config.accumulatedCost || returnAllFields) {
            this._gql += 'accumulatedCost ';
        }
        if (node._config.accumulatedReward || returnAllFields) {
            this._gql += 'accumulatedReward ';
        }
        if (node._config.currency || returnAllFields) {
            this._gql += 'currency ';
        }
        if (node._config.minPower || returnAllFields) {
            this._gql += 'minPower ';
        }
        if (node._config.averagePower || returnAllFields) {
            this._gql += 'averagePower ';
        }
        if (node._config.maxPower || returnAllFields) {
            this._gql += 'maxPower ';
        }
        if (node._config.powerProduction || returnAllFields) {
            this._gql += 'powerProduction ';
        }
        if (node._config.minPowerProduction || returnAllFields) {
            this._gql += 'minPowerProduction ';
        }
        if (node._config.maxPowerProduction || returnAllFields) {
            this._gql += 'maxPowerProduction ';
        }
        if (node._config.lastMeterProduction || returnAllFields) {
            this._gql += 'lastMeterProduction ';
        }
        if (node._config.powerFactor || returnAllFields) {
            this._gql += 'powerFactor ';
        }
        if (node._config.voltagePhase1 || returnAllFields) {
            this._gql += 'voltagePhase1 ';
        }
        if (node._config.voltagePhase2 || returnAllFields) {
            this._gql += 'voltagePhase2 ';
        }
        if (node._config.voltagePhase3 || returnAllFields) {
            this._gql += 'voltagePhase3 ';
        }
        if (node._config.currentL1 || returnAllFields) {
            this._gql += 'currentL1 ';
        }
        if (node._config.currentL2 || returnAllFields) {
            this._gql += 'currentL2 ';
        }
        if (node._config.currentL3 || returnAllFields) {
            this._gql += 'currentL3 ';
        }
        if (node._config.signalStrength || returnAllFields) {
            this._gql += 'signalStrength ';
        }
        this._gql += '}}';
    }

    get active() {
        return this._active;
    }

    set active(value: boolean) {
        if (value === this._active) {
            return;
        }
        this._active = value;
        if (this._active) {
            this.connect();
        } else {
            this.close();
        }
    }

    get connected() {
        return this._isConnected;
    }

    /**
     * Connect to Tibber feed.
     */
    public connect() {
        const node = this;
        if (node._isConnecting || node._isConnected) { return; }
        node._isConnecting = true;
        try {
            node._webSocket = new WebSocket(String(node._config.apiEndpoint.feedUrl), ['graphql-ws']);

            /**
             * Event: open
             * Called when websocket connection is established.
             */
            node._webSocket.onopen = (event: WebSocket.Event) => {
                if (!node._webSocket) {
                    return;
                }
                node.initConnection(node);
            };

            /**
             * Event: message
             * Called when data is received from the feed.
             */
            node._webSocket.onmessage = (message: WebSocket.MessageEvent) => {
                if (message.data && message.data.toString().startsWith('{')) {
                    const msg = JSON.parse(message.data.toString());
                    if (msg.type === 'connection_ack') {
                        node._isConnected = true;
                        node.emit('connection_ack', msg);
                        node.startSubscription(node._gql);
                    } else if (msg.type === 'connection_error') {
                        node._isConnected = true;
                        node.error(msg);
                        node.close();
                    } else if (msg.type === 'data') {
                        if (msg.payload && msg.payload.errors) {
                            node.emit('error', msg.payload.errors);
                        }
                        if (!msg.payload || !msg.payload.data) {
                            return;
                        }
                        const data = msg.payload.data.liveMeasurement;
                        node.emit('data', data);
                    } else {
                        node.warn(`Unrecognized message type: ${JSON.stringify(msg)}`);
                    }
                }
            };

            /**
             * Event: close
             * Called when feed is closed.
             */
            node._webSocket.onclose = (event: WebSocket.CloseEvent) => {
                node._isConnected = false;
                node.emit('disconnected', 'Disconnected from Tibber feed');
            };

            /**
             * Event: error
             * Called when an error has occurred.
             */
            node._webSocket.onerror = (error: WebSocket.ErrorEvent) => {
                node.error(error);
            };
        } finally {
            node._isConnecting = false;
        }
    }

    /**
     * Close the Tibber feed.
     */
    public close() {
        const node = this;
        node._hearbeatTimeouts.forEach((timeout: NodeJS.Timeout) => {
            clearTimeout(timeout);
        });
        if (node._webSocket) {
            if (node._isConnected && node._webSocket.readyState === WebSocket.OPEN) {
                node.stopSubscription(node);
                node.terminateConnection(node);
                node._webSocket.close();
            }
        }
        node.log('Closed Tibber Feed.');
    }

    /**
     * Heartbeat function used to keep connection alive.
     * Mostly for internal use, even if it is public.
     */
    public heartbeat() {
        const node = this;
        node._hearbeatTimeouts.forEach((timeout: NodeJS.Timeout) => {
            clearTimeout(timeout);
        });
        node._hearbeatTimeouts = [];
        node._hearbeatTimeouts.push(
            setTimeout(() => {
                if (node._webSocket) {
                    node._webSocket.terminate();
                    node._isConnected = false;
                    node.warn('Connection timed out after ' + node._timeout + ' ms.');
                    if (node._active) {
                        node.log('Reconnecting...');
                        node.connect();
                    }
                }
            }, node._timeout),
        );
    }

    private initConnection(node: this) {
        const query: IQuery = {
            type: 'connection_init',
            payload: `token=${node._config.apiEndpoint.apiKey}`,
        };
        node.sendQuery(query);
        node.emit('connected', 'Connected to Tibber feed.');
    }

    private terminateConnection(node: this) {
        const query: IQuery = {
            type: 'connection_terminate',
            payload: null,
        };
        node.sendQuery(query);
        node.emit('disconnecting', 'Sent connection_terminate to Tibber feed.');
    }

    startSubscription(subscription: string) {
        const node = this;
        const query: IQuery = {
            id: `${++TibberFeed._operationId}`,
            type: 'start',
            payload: {
                variables: {},
                extensions: {},
                operationName: null,
                query: subscription,
            } as IQueryPayload,
        };
        node.sendQuery(query);
    }

    private stopSubscription(node: this) {
        const query: IQuery = {
            id: `${TibberFeed._operationId}`,
            type: 'stop',
        };
        node.sendQuery(query);
        node.emit('disconnecting', 'Sent stop to Tibber feed.');
    }

    private sendQuery(query: IQuery) {
        if (!this._webSocket) {
            this.error('Invalid websocket.');
            return;
        }
        try {
            if (this._webSocket.readyState === WebSocket.OPEN) {
                this._webSocket.send(JSON.stringify(query));
            }
        } catch (error) {
            this.error(error);
        }
    }

    /**
     * Log function to emit log data to subscribers.
     * @param message Log message
     */
    private log(message: string) {
        try {
            this.emit('log', message);
        } catch (error) {
            // console.error(error);
        }
    }

    /**
     * Log function to emit warning log data to subscribers.
     * @param message Log message
     */
    private warn(message: string) {
        try {
            this.emit('warn', message);
        } catch (error) {
            // console.error(error);
        }
    }

    /**
     * Log function to emit error log data to subscribers.
     * @param message Log message
     */
    private error(message: any) {
        try {
            this.emit('error', message);
        } catch (error) {
            // console.error(error);
        }
    }
}
