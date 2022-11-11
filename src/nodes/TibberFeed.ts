import { EventEmitter } from 'events';
import { IConfig } from '../models/IConfig';
import { IQuery } from '../models/IQuery';
import { IQueryPayload } from "../models/IQueryPayload";
import WebSocket from 'ws';
import { GQL } from './models/GQL';
import { TibberQueryBase } from './TibberQueryBase';
import { version, release } from "../../Version"

export class TibberFeed extends EventEmitter {
    private _operationId: number = 0;
    private _timeout: number;
    private _config: IConfig;
    private _active: boolean;
    private _isConnected: boolean;
    private _isConnecting: boolean;
    private _gql: string;
    private _webSocket!: WebSocket;
    private _tibberQuery: TibberQueryBase;
    private _heartbeatTimeout: NodeJS.Timer | null;
    private _isClosing: boolean;

    /**
     * Constructor for creating a new instance if TibberFeed.
     * @param tibberQuery TibberQueryBase object
     * @param timeout Reconnection timeout
     * @see {TibberQueryBase}
     */
    constructor(tibberQuery: TibberQueryBase, timeout: number = 30000, returnAllFields = false) {
        super();

        if (!tibberQuery) {
            throw new Error('Missing mandatory parameter [tibberQuery]');
        }

        this._timeout = timeout;
        this._tibberQuery = tibberQuery;
        this._config = tibberQuery.config;
        this._active = this._config.active;
        this._heartbeatTimeout = null;
        this._isConnected = false;
        this._isConnecting = false;
        this._isClosing = false;
        this._gql = '';

        if (!this._config.endpoint || !this._config.endpoint.apiKey || !this._config.homeId) {
            this._active = false;
            this._config.active = false;
            this.warn('Missing mandatory parameters. Execution will halt.');
            return;
        }

        this._gql = 'subscription($homeId:ID!){liveMeasurement(homeId:$homeId){';
        if (this._config.timestamp || returnAllFields) {
            this._gql += 'timestamp ';
        }
        if (this._config.power || returnAllFields) {
            this._gql += 'power ';
        }
        if (this._config.lastMeterConsumption || returnAllFields) {
            this._gql += 'lastMeterConsumption ';
        }
        if (this._config.accumulatedConsumption || returnAllFields) {
            this._gql += 'accumulatedConsumption ';
        }
        if (this._config.accumulatedProduction || returnAllFields) {
            this._gql += 'accumulatedProduction ';
        }
        if (this._config.accumulatedConsumptionLastHour || returnAllFields) {
            this._gql += 'accumulatedConsumptionLastHour ';
        }
        if (this._config.accumulatedProductionLastHour || returnAllFields) {
            this._gql += 'accumulatedProductionLastHour ';
        }
        if (this._config.accumulatedCost || returnAllFields) {
            this._gql += 'accumulatedCost ';
        }
        if (this._config.accumulatedReward || returnAllFields) {
            this._gql += 'accumulatedReward ';
        }
        if (this._config.currency || returnAllFields) {
            this._gql += 'currency ';
        }
        if (this._config.minPower || returnAllFields) {
            this._gql += 'minPower ';
        }
        if (this._config.averagePower || returnAllFields) {
            this._gql += 'averagePower ';
        }
        if (this._config.maxPower || returnAllFields) {
            this._gql += 'maxPower ';
        }
        if (this._config.powerProduction || returnAllFields) {
            this._gql += 'powerProduction ';
        }
        if (this._config.minPowerProduction || returnAllFields) {
            this._gql += 'minPowerProduction ';
        }
        if (this._config.maxPowerProduction || returnAllFields) {
            this._gql += 'maxPowerProduction ';
        }
        if (this._config.lastMeterProduction || returnAllFields) {
            this._gql += 'lastMeterProduction ';
        }
        if (this._config.powerFactor || returnAllFields) {
            this._gql += 'powerFactor ';
        }
        if (this._config.voltagePhase1 || returnAllFields) {
            this._gql += 'voltagePhase1 ';
        }
        if (this._config.voltagePhase2 || returnAllFields) {
            this._gql += 'voltagePhase2 ';
        }
        if (this._config.voltagePhase3 || returnAllFields) {
            this._gql += 'voltagePhase3 ';
        }
        if (this._config.currentL1 || returnAllFields) {
            this._gql += 'currentL1 ';
        }
        if (this._config.currentL2 || returnAllFields) {
            this._gql += 'currentL2 ';
        }
        if (this._config.currentL3 || returnAllFields) {
            this._gql += 'currentL3 ';
        }
        if (this._config.signalStrength || returnAllFields) {
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
    public async connect() {
        if (this._isConnecting || this._isConnected) { return; }
        this._isConnecting = true;
        try {
            const url = await this._tibberQuery.getWebsocketSubscriptionUrl();
            const options = {
                headers: {
                    'Authorization': `Bearer ${this._config.endpoint.apiKey}`,
                    'User-Agent': (`${this._config.endpoint.userAgent ?? ''} bisand/tibber-api/${version}`).trim()
                }
            }
            this._webSocket = new WebSocket(url.href, ['graphql-transport-ws'], options);

            /**
             * Event: open
             * Called when websocket connection is established.
             */
            this._webSocket.onopen = (event: WebSocket.Event) => {
                if (!this._webSocket) {
                    return;
                }
                this.initConnection();
            };

            /**
             * Event: message
             * Called when data is received from the feed.
             */
            this._webSocket.onmessage = (message: WebSocket.MessageEvent) => {
                if (message.data && message.data.toString().startsWith('{')) {
                    const msg = JSON.parse(message.data.toString());
                    switch (msg.type) {
                        case GQL.CONNECTION_ERROR:
                            this.error(`A connection error occurred: ${JSON.stringify(msg)}`);
                            this.close();
                            break;
                        case GQL.CONNECTION_ACK:
                            this._isConnected = true;
                            this.emit('connected', 'Connected to Tibber feed.');
                            this.emit(GQL.CONNECTION_ACK, msg);
                            this.startSubscription(this._gql, { homeId: this._config.homeId });
                            break;
                        case GQL.NEXT:
                            if (msg.payload && msg.payload.errors) {
                                this.emit('error', msg.payload.errors);
                            }
                            if (msg.id != this._operationId) {
                                this.log(`Message contains unexpected id ${JSON.stringify(msg)}`);
                                return;
                            }
                            if (!msg.payload || !msg.payload.data) {
                                return;
                            }
                            const data = msg.payload.data.liveMeasurement;
                            this.emit('data', data);
                            this.heartbeat();
                            break;
                        case GQL.ERROR:
                            this.error(`An error occurred: ${JSON.stringify(msg)}`);
                            break;
                        case GQL.COMPLETE:
                            if (msg.id != this._operationId) {
                                this.log(`Complete message contains unexpected id ${JSON.stringify(msg)}`);
                                return;
                            }
                            this.log('Received complete message. Closing connection.');
                            this.close();
                            if (this._active) {
                                this.log('Reconnecting...');
                                this.connect();
                            }
                            break;

                        default:
                            this.warn(`Unrecognized message type: ${JSON.stringify(msg)}`);
                            break;
                    }
                }
            };

            /**
             * Event: close
             * Called when feed is closed.
             */
            this._webSocket.onclose = (event: WebSocket.CloseEvent) => {
                this._isConnected = false;
                this.emit('disconnected', 'Disconnected from Tibber feed.');
                this.warn(`Unrecognized message type: ${JSON.stringify(event)}`);
            };

            /**
             * Event: error
             * Called when an error has occurred.
             */
            this._webSocket.onerror = (error: WebSocket.ErrorEvent) => {
                this.error(error);
            };
        } catch (reason) {
            this.error(reason);
        } finally {
            this._isConnecting = false
        };
    }

    /**
     * Close the Tibber feed.
     */
    public close() {
        this._isClosing = true;
        if (this._heartbeatTimeout)
            clearTimeout(this._heartbeatTimeout);
        if (this._webSocket) {
            if (this._isConnected && this._webSocket.readyState === WebSocket.OPEN) {
                this.stopSubscription();
                this._webSocket.close(1000, 'Normal Closure');
                this._webSocket.terminate();
            }
        }
        this._isClosing = false;
        this.log('Closed Tibber Feed.');
    }

    /**
     * Heartbeat function used to keep connection alive.
     * Mostly for internal use, even if it is public.
     */
    public heartbeat() {
        if (this._isClosing)
            return;

        if (this._heartbeatTimeout) {
            this._heartbeatTimeout.refresh();
            return;
        }

        this._heartbeatTimeout = setTimeout(() => {
            if (this._webSocket) {
                this.stopSubscription();
                this._webSocket.terminate();
                this._isConnected = false;
                this.warn('Connection timed out after ' + this._timeout + ' ms.');
                if (this._active) {
                    this.log('Reconnecting...');
                    this.connect();
                }
                this._heartbeatTimeout = null;
            }
        }, this._timeout);
    }

    private initConnection() {
        const query: IQuery = {
            type: GQL.CONNECTION_INIT,
            payload: { 'token': this._config.endpoint.apiKey },
        };
        this.sendQuery(query);
        this.emit('connecting', 'Initiating Tibber feed.');
    }

    private startSubscription(subscription: string, variables: Record<string, unknown> | null) {
        const query: IQuery = {
            id: `${++this._operationId}`,
            type: GQL.SUBSCRIBE,
            payload: {
                variables: variables,
                extensions: {},
                operationName: null,
                query: subscription,
            } as IQueryPayload,
        };
        this.sendQuery(query);
    }

    private stopSubscription() {
        const query: IQuery = {
            id: `${this._operationId}`,
            type: GQL.COMPLETE,
        };
        this.sendQuery(query);
        this.emit('disconnecting', 'Sent stop to Tibber feed.');
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
