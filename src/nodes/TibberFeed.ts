import { EventEmitter } from 'events';
import { IConfig } from '../models/IConfig';
import { IQuery } from '../models/IQuery';
import { IQueryPayload } from "../models/IQueryPayload";
import WebSocket from 'ws';

export class TibberFeed extends EventEmitter {
    private _timeout: number;
    private _config: IConfig;
    private _active: boolean;
    private _hearbeatTimeouts: NodeJS.Timeout[];
    private _isConnected: boolean;
    private _gql: string;
    private _webSocket!: WebSocket;

    /**
     * Constructor for creating a new instance if TibberFeed.
     * @param config IConfig object
     * @param timeout Reconnection timeout
     * @see IConfig
     */
    constructor(config: IConfig, timeout: number = 30000) {
        super();

        const node = this;
        this._timeout = timeout;
        this._config = config;
        this._active = config.active;
        this._hearbeatTimeouts = [];
        this._isConnected = false;
        this._gql = '';

        if (!config.apiEndpoint || !config.apiEndpoint.apiKey || !config.homeId || !config.apiEndpoint.feedUrl) {
            node._active = false;
            config.active = false;
            node.warn('Missing mandatory parameters. Execution will halt.');
            return;
        }

        this._gql = 'subscription{liveMeasurement(homeId:"' + node._config.homeId + '"){';
        if (node._config.timestamp) {
            this._gql += 'timestamp ';
        }
        if (node._config.power) {
            this._gql += 'power ';
        }
        if (node._config.lastMeterConsumption) {
            this._gql += 'lastMeterConsumption ';
        }
        if (node._config.accumulatedConsumption) {
            this._gql += 'accumulatedConsumption ';
        }
        if (node._config.accumulatedProduction) {
            this._gql += 'accumulatedProduction ';
        }
        if (node._config.accumulatedCost) {
            this._gql += 'accumulatedCost ';
        }
        if (node._config.accumulatedReward) {
            this._gql += 'accumulatedReward ';
        }
        if (node._config.currency) {
            this._gql += 'currency ';
        }
        if (node._config.minPower) {
            this._gql += 'minPower ';
        }
        if (node._config.averagePower) {
            this._gql += 'averagePower ';
        }
        if (node._config.maxPower) {
            this._gql += 'maxPower ';
        }
        if (node._config.powerProduction) {
            this._gql += 'powerProduction ';
        }
        if (node._config.minPowerProduction) {
            this._gql += 'minPowerProduction ';
        }
        if (node._config.maxPowerProduction) {
            this._gql += 'maxPowerProduction ';
        }
        if (node._config.lastMeterProduction) {
            this._gql += 'lastMeterProduction ';
        }
        if (node._config.powerFactor) {
            this._gql += 'powerFactor ';
        }
        if (node._config.voltagePhase1) {
            this._gql += 'voltagePhase1 ';
        }
        if (node._config.voltagePhase2) {
            this._gql += 'voltagePhase2 ';
        }
        if (node._config.voltagePhase3) {
            this._gql += 'voltagePhase3 ';
        }
        if (node._config.currentL1 || node._config.currentPhase1) {
            this._gql += 'currentL1 ';
        }
        if (node._config.currentL2 || node._config.currentPhase2) {
            this._gql += 'currentL2 ';
        }
        if (node._config.currentL3 || node._config.currentPhase3) {
            this._gql += 'currentL3 ';
        }
        if (node._config.signalStrength) {
            this._gql += 'signalStrength ';
        }
        this._gql += '}}';
    }

    get active() {
        return this._active;
    }

    set active(active) {
        if (active === this._active) {
            return;
        }
        this._active = active;
        if (this._active) {
            this.connect();
        } else {
            this.close();
        }
    }

    /**
     * Connect to Tibber feed.
     */
    public connect() {
        const node = this;
        node._webSocket = new WebSocket(String(node._config.apiEndpoint.feedUrl), ['graphql-ws']);

        /**
         * Event: open
         * Called when websocket connection is established.
         */
        node._webSocket.on('open', () => {
            if (!node._webSocket) {
                return;
            }
            node.initConnection(node);
        });

        /**
         * Event: message
         * Called when data is received from the feed.
         */
        node._webSocket.on('message', (message: string) => {
            if (message.startsWith('{')) {
                const msg = JSON.parse(message);
                if (msg.type === 'connection_ack') {
                    node._isConnected = true;
                    node.emit('connection_ack', msg);
                    const query: IQuery = {
                        id: '1',
                        type: 'start',
                        payload: {
                            query: node._gql,
                        } as IQueryPayload,
                    };
                    node.sendQuery(query);
                } else if (msg.type === 'connection_error') {
                    node.error(msg);
                    node.close();
                } else if (msg.type === 'data') {
                    if (!msg.payload.data) {
                        return;
                    }
                    const data = msg.payload.data.liveMeasurement;

                    // TODO: Remove this in future releases.
                    // Workaround to support deprecated properties. Will be removed in the future.
                    if (data.currentL1 !== undefined) {
                        data.currentPhase1 = data.currentL1;
                    }
                    if (data.currentL2 !== undefined) {
                        data.currentPhase2 = data.currentL2;
                    }
                    if (data.currentL3 !== undefined) {
                        data.currentPhase3 = data.currentL3;
                    }

                    node.emit('data', data);
                }
            }
        });

        /**
         * Event: close
         * Called when feed is closed.
         */
        node._webSocket.on('close', () => {
            node._isConnected = false;
            node.emit('disconnected', 'Disconnected from Tibber feed');
        });

        /**
         * Event: error
         * Called when an error has occurred.
         */
        node._webSocket.on('error', (error: any) => {
            node.error(error);
        });
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
            if (node._isConnected) {
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
        for (let i = 0; i < node._hearbeatTimeouts.length; i++) {
            const timeout = node._hearbeatTimeouts[i];
            clearTimeout(timeout);
            node._hearbeatTimeouts.shift();
            i--;
        }
        node._hearbeatTimeouts.push(
            setTimeout(() => {
                if (node._webSocket) {
                    node._webSocket.terminate();
                    node.warn('Connection timed out after ' + node._timeout + ' ms. Reconnecting...');
                    node.connect();
                }
            }, node._timeout),
        );
    }

    private initConnection(node: this) {
        const query: IQuery = {
            id: '1',
            type: 'connection_init',
            payload: {
                token: node._config.apiEndpoint.apiKey,
            } as IQueryPayload,
        };
        node.sendQuery(query);
        node.emit('connected', 'Connected to Tibber feed.');
    }

    private terminateConnection(node: this) {
        const query: IQuery = {
            id: '1',
            type: 'connection_terminate',
        };
        node.sendQuery(query);
        node.emit('disconnected', 'Sent connection_terminate to Tibber feed.');
    }

    private sendQuery(query: IQuery) {
        if (!this._webSocket) {
            this.error('Invalid websocket.');
        }
        try {
            this._webSocket.send(JSON.stringify(query));
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
