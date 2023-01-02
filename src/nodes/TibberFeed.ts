import { EventEmitter } from 'events';
import { IConfig } from '../models/IConfig';
import { IQuery } from '../models/IQuery';
import { IQueryPayload } from "../models/IQueryPayload";
import WebSocket from 'ws';
import { GQL } from './models/GQL';
import { TibberQueryBase } from './TibberQueryBase';
import { version } from "../../Version"

export class TibberFeed extends EventEmitter {
    private _operationId: number = 0;
    private _feedConnectionTimeout: number;
    private _feedIdleTimeout: number;
    private _config: IConfig;
    private _active: boolean;
    private _isConnected: boolean;
    private _isConnecting: boolean;
    private _gql: string;
    private _webSocket!: WebSocket;
    private _tibberQuery: TibberQueryBase;
    private _timerHeartbeat: NodeJS.Timer | null;
    private _timerConnect: NodeJS.Timer | null;
    private _timerConnectionTimeout: NodeJS.Timer | null;
    private _isClosing: boolean;
    private _isUnauthenticated: boolean;

    private _lastRetry: number;
    private _retryBackoff: number;
    private _connectionAttempts: number;
    private _backoffDelayBase: number;
    private _backoffDelayMax: number;
    private _realTimeConsumptionEnabled?: boolean | null;

    /**
     * Constructor for creating a new instance if TibberFeed.
     * @constructor
     * @param {TibberQueryBase} tibberQuery TibberQueryBase object.
     * @param {number} timeout Feed idle timeout. The feed will reconnect after being idle for more than the specified number of milliseconds.
     * @param {boolean} returnAllFields Specify if you want to return all fields from the data feed.
     * @param {number} connectionTimeout Feed connection timeout.
     * @see {@linkcode TibberQueryBase}
     */
    constructor(tibberQuery: TibberQueryBase, timeout: number = 60000, returnAllFields = false, connectionTimeout: number = 10000) {
        super();

        if (!tibberQuery || !(tibberQuery instanceof TibberQueryBase)) {
            throw new Error('Missing mandatory parameter [tibberQuery]');
        }

        this._feedConnectionTimeout = connectionTimeout;
        this._feedIdleTimeout = timeout;
        this._tibberQuery = tibberQuery;
        this._config = tibberQuery.config;
        this._active = this._config.active;
        this._timerHeartbeat = null;
        this._timerConnect = null;
        this._timerConnectionTimeout = null;
        this._isConnected = false;
        this._isConnecting = false;
        this._isClosing = false;
        this._isUnauthenticated = false;
        this._gql = '';

        this._realTimeConsumptionEnabled = null;
        this._lastRetry = 0;
        this._connectionAttempts = 0;
        this._backoffDelayBase = 1000; // 1 second
        this._backoffDelayMax = 1000 * 60 * 60 * 24; // 1 day
        this._retryBackoff = 1000;

        if (!this._config.apiEndpoint || !this._config.apiEndpoint.apiKey || !this._config.homeId) {
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

    get active(): boolean {
        return this._active;
    }

    set active(value: boolean) {
        if (value === this._active) {
            return;
        }
        this._active = value;
        if (this._active) {
            this.connectWithTimeout();
        } else {
            this.close();
        }
    }

    get connected(): boolean {
        return this._isConnected;
    }

    private get canConnect(): boolean {
        const result = Date.now() > (this._lastRetry + this._retryBackoff);
        if (result) {
            this._lastRetry = Date.now();
            this._connectionAttempts++;
            this._retryBackoff = this.getBackoffWithJitter(this._connectionAttempts);
        }
        this.log(`Can connect: ${result}. Last retry: ${this._lastRetry}. With backoff for: ${this._retryBackoff} ms.`);
        return result;
    }

    /**
     * Clear timeout for a timer.
     * @param {NodeJS.Timer | null} timer Timer handle to clear
     */
    private clearTimer(timer: NodeJS.Timer | null) {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    }

    /**
     * Generate random number with a max value.
     * @param {number} max Maximum number
     * @returns {number} Random number.
     */
    private getRandomInt(max: number): number {
        return Math.floor(Math.random() * max);
    }

    /**
     * Exponential backoff with jitter
     * @param {number} attempt Connection attempt
     * @returns {number}
     */
    private getBackoffWithJitter(attempt: number): number {
        const exponential = Math.pow(2, attempt) * this._backoffDelayBase;
        const delay = Math.min(exponential, this._backoffDelayMax);
        return delay / 2 + this.getRandomInt(delay / 2);
    }

    /**
     * Connect to feed with built in delay, timeout and backoff.
     */
    private async connectWithTimeout(): Promise<void> {
        if (this._isConnecting || this._isConnected) { return; }
        this._isConnecting = true;

        if (!this.canConnect) {
            this._isConnecting = false;
            return;
        }

        const unauthenticatedMessage = `Unauthenticated! Invalid token. Please provide a valid token and try again.`;
        if (this._isUnauthenticated) {
            this.error(unauthenticatedMessage);
            this._isConnecting = false;
            return;
        }

        if (this._realTimeConsumptionEnabled === null) {
            try {
                this._realTimeConsumptionEnabled = await this._tibberQuery.getRealTimeEnabled(this._config.homeId ?? '');
            } catch (error: any) {
                if (error?.httpCode === 400
                    && Array.isArray(error?.errors)
                    && error?.errors.find((x: any) => x?.extensions?.code === 'UNAUTHENTICATED')) {
                    this._isUnauthenticated = true;
                    this.error(unauthenticatedMessage);
                } else {
                    this.error(`An error ocurred while trying to check if real time consumption is enabled.\n${JSON.stringify(error)}`);
                }
                this._isConnecting = false;
                return;
            }
        } else if (!this._realTimeConsumptionEnabled) {
            this.warn(`Unable to connect. Real Time Consumtion is not enabled.`);
            return;
        }

        this.clearTimer(this._timerConnect);
        this.clearTimer(this._timerConnectionTimeout);
        this._timerConnect = setTimeout(async () => {
            this.log('Connecting...');
            this.emit('connecting', { timeout: this._retryBackoff + this._backoffDelayBase, retryBackoff: this._retryBackoff });
            await this.internalConnect();
            this._timerConnectionTimeout = setTimeout(() => {
                this.error('Connection timeout');
                this.emit('connection_timeout', { timeout: this._feedConnectionTimeout });
                if (this._webSocket)
                    this.terminateConnection();
                if (this._active)
                    this.connectWithTimeout();
            }, this._feedConnectionTimeout);
        }, this._retryBackoff + this._backoffDelayBase);
    }

    /**
     * Internal connection method that handles the communication with tibber feed.
     */
    private async internalConnect(): Promise<void> {
        try {
            const url = await this._tibberQuery.getWebsocketSubscriptionUrl();
            const options = {
                headers: {
                    'Authorization': `Bearer ${this._config.apiEndpoint.apiKey}`,
                    'User-Agent': (`${this._config.apiEndpoint.userAgent ?? ''} bisand/tibber-api/${version}`).trim()
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
                            this.clearTimer(this._timerConnectionTimeout);
                            this._connectionAttempts = 0;
                            this._backoffDelayBase = 1000;
                            this.startSubscription(this._gql, { homeId: this._config.homeId });
                            this.emit('connected', 'Connected to Tibber feed.');
                            this.emit(GQL.CONNECTION_ACK, msg);
                            this.heartbeat();
                            break;
                        case GQL.NEXT:
                            if (msg.payload && msg.payload.errors) {
                                this.emit('error', msg.payload.errors);
                            }
                            if (Number(msg.id) !== this._operationId) {
                                this.log(`Message contains unexpected id ${JSON.stringify(msg)}`);
                                this.stopSubscription(Number(msg.id));
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
                            if (Number(msg.id) !== this._operationId) {
                                this.log(`Complete message contains unexpected id ${JSON.stringify(msg)}`);
                                return;
                            }
                            this.log('Received complete message. Closing connection.');
                            this.close();
                            if (this._active) {
                                this.connectWithTimeout();
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
     * Connect to Tibber feed.
     */
    public async connect(): Promise<void> {
        await this.connectWithTimeout();
    }

    /**
     * Close the Tibber feed.
     */
    public close() {
        this._isClosing = true;
        this.clearTimer(this._timerHeartbeat);
        this.clearTimer(this._timerConnect);
        if (this._webSocket) {
            if (this._isConnected && this._webSocket.readyState === WebSocket.OPEN) {
                this.closeConnection();
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

        this.clearTimer(this._timerHeartbeat);
        this._timerHeartbeat = setTimeout(() => {
            if (this._webSocket) {
                this.terminateConnection();
                this._timerHeartbeat = null;
            }
            this.warn(`Connection timed out after ${this._feedIdleTimeout} ms.`);
            this.emit('heatbeat_timeout', { timeout: this._feedIdleTimeout });
            if (this._active) {
                this.connectWithTimeout();
            }
        }, this._feedIdleTimeout);
    }

    /**
     * Gracefully close connection with Tibber.
     */
    private closeConnection() {
        this.stopSubscription();
        this._webSocket.close(1000, 'Normal Closure');
        this._webSocket.terminate();
    }

    /**
     * Forcefully terminate connection with Tibber.
     */
    private terminateConnection() {
        this.stopSubscription();
        this._webSocket.terminate();
        this._isConnected = false;
    }

    /**
     * Initialize connection with Tibber.
     */
    private initConnection() {
        const query: IQuery = {
            type: GQL.CONNECTION_INIT,
            payload: { 'token': this._config.apiEndpoint.apiKey },
        };
        this.sendQuery(query);
        this.emit('init_connection', 'Initiating Tibber feed.');
    }

    /**
     * Subscribe to a specified resource.
     * @param subscription @typedef string Name of the resource to subscribe to.
     * @param variables @typedef Record<string, unknown> Variable to use with the resource.
     */
    private startSubscription(subscription: string, variables: Record<string, unknown> | null) {
        const query: IQuery = {
            id: `${++this._operationId}`,
            type: GQL.SUBSCRIBE,
            payload: {
                variables,
                extensions: {},
                operationName: null,
                query: subscription,
            } as IQueryPayload,
        };
        this.sendQuery(query);
    }

    /**
     * Stops subscribing to a resource with a specified operation Id
     * @param {number} operationId Operation Id to stop subscribing to.
     */
    private stopSubscription(operationId?: number) {
        const query: IQuery = {
            id: `${operationId ?? this._operationId}`,
            type: GQL.COMPLETE,
        };
        this.sendQuery(query);
        this.emit('disconnecting', 'Sent stop to Tibber feed.');
    }

    /**
     * Send websocket query to Tibber
     * @param {IQuery} query Tibber GQL query
     */
    private sendQuery(query: IQuery): void {
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
     * @param {string} message Log message
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
     * @param {string} message Log message
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
     * @param {any} message Log message
     */
    private error(message: any) {
        try {
            this.emit('error', message);
        } catch (error) {
            // console.error(error);
        }
    }
}
