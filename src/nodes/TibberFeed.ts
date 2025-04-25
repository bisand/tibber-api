import { EventEmitter } from 'events';
import { IConfig } from '../models/IConfig';
import { IQuery } from '../models/IQuery';
import { IQueryPayload } from "../models/IQueryPayload";
import WebSocket from 'ws';
import { GQL } from './models/GQL';
import { TibberQueryBase } from './TibberQueryBase';
import { HeaderManager } from '../tools/HeaderManager';

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
    private _timerHeartbeat: NodeJS.Timeout[];
    private _timerConnect: NodeJS.Timeout[];
    private _timerConnectionTimeout: NodeJS.Timeout[];
    private _isClosing: boolean;
    private _isUnauthenticated: boolean;
    private _headerManager: HeaderManager;

    private _lastRetry: number;
    private _retryBackoff: number;
    private _connectionAttempts: number;
    private _backoffDelayBase: number;
    private _backoffDelayMax: number;
    private _realTimeConsumptionEnabled?: boolean | null;
    private _failedAttempts: number = 0;
    private _maxFailedAttempts: number = 10; // You can tune this value

    private _timeoutCount: number;
    public get timeoutCount(): number {
        return this._timeoutCount;
    }

    /**
     * Constructor for creating a new instance if TibberFeed.
     * @constructor
     * @param {TibberQueryBase} tibberQuery TibberQueryBase object.
     * @param {number} timeout Feed idle timeout in milliseconds. The feed will reconnect after being idle for more than the specified number of milliseconds. Min 5000 ms.
     * @param {boolean} returnAllFields Specify if you want to return all fields from the data feed.
     * @param {number} connectionTimeout Feed connection timeout.
     * @see {@linkcode TibberQueryBase}
     */
    constructor(tibberQuery: TibberQueryBase, timeout: number = 60000, returnAllFields: boolean = false, connectionTimeout: number = 30000) {
        super();

        if (!tibberQuery || !(tibberQuery instanceof TibberQueryBase)) {
            throw new Error('Missing mandatory parameter [tibberQuery]');
        }

        this._feedConnectionTimeout = connectionTimeout > 5000 ? connectionTimeout : 5000;
        this._feedIdleTimeout = timeout > 5000 ? timeout : 5000;
        this._tibberQuery = tibberQuery;
        this._config = tibberQuery.config;
        this._headerManager = new HeaderManager(this._config);
        this._active = this._config.active;
        this._timerHeartbeat = [];
        this._timerConnect = [];
        this._timerConnectionTimeout = [];
        this._isConnected = false;
        this._isConnecting = false;
        this._isClosing = false;
        this._isUnauthenticated = false;
        this._gql = '';

        this._realTimeConsumptionEnabled = null;
        this._lastRetry = 0;
        this._connectionAttempts = 0;
        this._backoffDelayBase = 1000; // 1 second
        this._backoffDelayMax = 1000 * 60 * 60 * 1; // 1 hour
        this._retryBackoff = 1000;

        this._timeoutCount = 0;

        const { apiEndpoint, homeId } = this._config;
        if (!apiEndpoint || !apiEndpoint.apiKey || !homeId) {
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
            if (!this._active)
                this.close();
            return;
        }
        this._active = value;
        if (this._active) {
            this.connectWithDelayWorker(1);
        } else {
            this.close();
        }
    }

    get connected(): boolean {
        return this._isConnected;
    }

    get feedIdleTimeout(): number {
        return this._feedIdleTimeout;
    }

    set feedIdleTimeout(value: number) {
        if (value === this._feedIdleTimeout) {
            return;
        }
        this._feedIdleTimeout = value;
    }

    get feedConnectionTimeout(): number {
        return this._feedConnectionTimeout;
    }

    set feedConnectionTimeout(value: number) {
        if (value === this._feedConnectionTimeout) {
            return;
        }
        this._feedConnectionTimeout = value;
    }

    get queryRequestTimeout(): number {
        return this._tibberQuery?.requestTimeout;
    }

    set queryRequestTimeout(value: number) {
        if (value === this._tibberQuery?.requestTimeout) {
            return;
        }
        if (this._tibberQuery)
            this._tibberQuery.requestTimeout = value;
    }

    public get config(): IConfig {
        return this._tibberQuery.config;
    }

    public set config(value: IConfig) {
        this._tibberQuery.config = value;
    }

    private get canConnect(): boolean {
        const result = Date.now() > (this._lastRetry + this._retryBackoff);
        if (result) {
            this._lastRetry = Date.now();
            if (this._retryBackoff < this._backoffDelayMax)
                this._connectionAttempts++;
            this._retryBackoff = this.getBackoffWithJitter(this._connectionAttempts);
        }
        this.log(`Can connect: ${result}. Last retry: ${this._lastRetry}. With backoff for: ${this._retryBackoff} ms.`);
        return result;
    }

    /**
     * PUBLIC METHODS
     * ----------------
     * These methods are used to interact with the TibberFeed.
     * ----------------
     * */

    /**
     * Connect to Tibber feed.
     */
    public async connect(): Promise<void> {
        this.connectWithDelayWorker(1);
    }

    /**
     * Close the Tibber feed.
     */
    public close() {
        this._isClosing = true;
        this.cancelTimeouts(this._timerHeartbeat);
        this.cancelTimeouts(this._timerConnect);
        this.cancelTimeouts(this._timerConnectionTimeout);
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

        this.cancelTimeouts(this._timerHeartbeat);
        this.addTimeout(this._timerHeartbeat, () => {
            if (this._webSocket) {
                this.terminateConnection();
            }
            this.warn(`Connection timed out after ${this._feedIdleTimeout} ms.`);
            this.emit('heartbeat_timeout', { timeout: this._feedIdleTimeout });
            if (this._active) {
                this.emit('heartbeat_reconnect', { connection_attempt: this._connectionAttempts, backoff: this._retryBackoff });
                this.connectWithDelayWorker();
            }
        }, this._feedIdleTimeout);
    }

    /**
     * PRIVATE METHODS
     * ----------------
     * These methods are used internally by the TibberFeed.
     * ----------------
     * */

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
        const exponential = Math.min(Math.pow(2, attempt) * this._backoffDelayBase, this._backoffDelayMax);
        return exponential / 2 + this.getRandomInt(exponential / 2);
    }

    /**
     * Decreases the connection backoff.
     */
    private decreaseConnectionBackoff() {
        if (this._connectionAttempts > 0) {
            this._connectionAttempts--;
            this._retryBackoff = this.getBackoffWithJitter(this._connectionAttempts);
        }
    }

    /**
     * Add a timeout to an array of timeouts.
     * @param {NodeJS.Timeout[]} timers List og timeouts
     * @param {void} callback Callback function to call when timeout is reached.
     * @param {number} delayMs Delay in milliseconds before callback will be called.
     */
    private addTimeout(timers: NodeJS.Timeout[], callback: () => void, delayMs: number) {
        this._timeoutCount++;
        timers.push(setTimeout(callback, delayMs));
    }

    /**
     * Clear timeout for a timer.
     * @param {NodeJS.Timeout[]} timers Timer handle to clear
     */
    private cancelTimeouts(timers: NodeJS.Timeout[]) {
        try {
            while (timers.length) {
                const timer = timers.pop();
                if (timer) {
                    this._timeoutCount--;
                    clearTimeout(timer);
                }
            }
        } catch (error) {
            this.error(error);
        }
    }

    /**
     * Connect to feed with built in delay, timeout and backoff.
     */
    private async connectWithTimeout(): Promise<void> {
        if (this._isConnecting || this._isConnected) { return; }
        this._isConnecting = true;

        if (!this.canConnect) {
            this._isConnecting = false;
            this.incrementFailedAttempts();
            return;
        }

        const unauthenticatedMessage = `Unauthenticated! Invalid token. Please provide a valid token and try again.`;
        if (this._isUnauthenticated) {
            this.error(unauthenticatedMessage);
            this._isConnecting = false;
            this.incrementFailedAttempts();
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
                this.incrementFailedAttempts();
                return;
            }
        } else if (!this._realTimeConsumptionEnabled) {
            this.warn(`Unable to connect. Real Time Consumtion is not enabled.`);
            this.incrementFailedAttempts();
            return;
        }

        this.cancelTimeouts(this._timerConnect);
        this.cancelTimeouts(this._timerConnectionTimeout);
        this.log('Connecting...');
        this.emit('connecting', { timeout: this._retryBackoff + this._backoffDelayBase, retryBackoff: this._retryBackoff });
        // Set connection timeout.
        this.addTimeout(this._timerConnectionTimeout, () => {
            this.error('Connection timeout');
            this.emit('connection_timeout', { timeout: this._feedConnectionTimeout });
            if (this._webSocket)
                this.terminateConnection();
            this.incrementFailedAttempts();
            if (this._active)
                this.connectWithDelayWorker();
        }, this._feedConnectionTimeout);
        // Perform connection.
        await this.internalConnect();
    }

    private incrementFailedAttempts() {
        this._failedAttempts++;
        if (this._failedAttempts >= this._maxFailedAttempts) {
            this.warn(`Max failed attempts (${this._maxFailedAttempts}) reached. Performing hard reset.`);
            this.hardReset();
        }
    }

    private resetFailedAttempts() {
        this._failedAttempts = 0;
    }

    private hardReset() {
        this.log('Performing hard reset of TibberFeed...');
        this._isConnecting = false;
        this._isConnected = false;
        this._isClosing = false;
        this._isUnauthenticated = false;
        this._realTimeConsumptionEnabled = null;
        this._connectionAttempts = 0;
        this._retryBackoff = this._backoffDelayBase;
        this.resetFailedAttempts();
        this.cancelTimeouts(this._timerHeartbeat);
        this.cancelTimeouts(this._timerConnect);
        this.cancelTimeouts(this._timerConnectionTimeout);
        if (this._webSocket) {
            try {
                this._webSocket.terminate();
            } catch (e) {}
            this._webSocket = undefined as any;
        }
        if (this._active) {
            this.connectWithDelayWorker(5000); // Wait a bit before retrying
        }
    }

    /**
     * Connect with a delay if the feed is still active.
     */
    private connectWithDelayWorker(delay: number = 1000) {
        this.cancelTimeouts(this._timerConnect);
        if (this._active) {
            this.addTimeout(this._timerConnect, () => {
                try {
                    this.connectWithTimeout();
                } catch (error) {
                    this.error(error);
                }
                this.connectWithDelayWorker();
            }, delay);
        }
    }

    /**
     * Internal connection method that handles the communication with tibber feed.
     */
    private async internalConnect(): Promise<void> {
        const { apiEndpoint } = this._config;
        if (!apiEndpoint || !apiEndpoint.apiKey) {
            this.error('Missing mandatory parameters: apiEndpoint or apiKey. Execution will halt.');
            throw new Error('Missing mandatory parameters: apiEndpoint or apiKey.');
        }

        try {
            const url = await this._tibberQuery.getWebsocketSubscriptionUrl();
            const options = {
                headers: {
                    'Authorization': `Bearer ${apiEndpoint.apiKey}`,
                    'User-Agent': this._headerManager.userAgent,
                }
            }
            this._webSocket = new WebSocket(url.href, ['graphql-transport-ws'], options);
            this._webSocket.onopen = this.onWebSocketOpen.bind(this);
            this._webSocket.onmessage = this.onWebSocketMessage.bind(this);
            this._webSocket.onclose = this.onWebSocketClose.bind(this);
            this._webSocket.onerror = this.onWebSocketError.bind(this);
        } catch (reason) {
            this.error(reason);
        } finally {
            this._isConnecting = false
        };
    }

    /**
     * Event: onWebSocketOpen
     * Called when websocket connection is established.
     */
    private onWebSocketOpen(event: WebSocket.Event) {
        if (!this._webSocket) {
            return;
        }
        this.initConnection();
    }

    /**
     * Event: onWebSocketClose
     * Called when feed is closed.
     * @param {WebSocket.CloseEvent} event Close event
     */
    private onWebSocketClose(event: WebSocket.CloseEvent) {
        this._isConnected = false;
        this.emit('disconnected', 'Disconnected from Tibber feed.');
    }

    /**
     * Event: onWebSocketMessage
     * Called when data is received from the feed.
     * @param {WebSocket.MessageEvent} event Message event
     */
    private onWebSocketMessage(message: WebSocket.MessageEvent) {
        if (message.data && message.data.toString().startsWith('{')) {
            const msg = JSON.parse(message.data.toString());
            switch (msg.type) {
                case GQL.CONNECTION_ERROR:
                    this.error(`A connection error occurred: ${JSON.stringify(msg)}`);
                    this.close();
                    break;
                case GQL.CONNECTION_ACK:
                    this._isConnected = true;
                    this.resetFailedAttempts();
                    this.cancelTimeouts(this._timerConnectionTimeout);
                    this.startSubscription(this._gql, { homeId: this._config.homeId });
                    this.heartbeat();
                    this.emit('connected', 'Connected to Tibber feed.');
                    this.emit(GQL.CONNECTION_ACK, msg);
                    break;
                case GQL.NEXT:
                    if (msg.payload && msg.payload.errors) {
                        this.emit('error', msg.payload.errors);
                    }
                    if (Number(msg.id) !== this._operationId) {
                        // this.log(`Message contains unexpected id and will be ignored.\n${JSON.stringify(msg)}`);
                        return;
                    }
                    if (!msg.payload || !msg.payload.data) {
                        return;
                    }
                    this.decreaseConnectionBackoff();
                    const data = msg.payload.data.liveMeasurement;
                    this.heartbeat();
                    this.emit('data', data);
                    break;
                case GQL.ERROR:
                    this.error(`An error occurred: ${JSON.stringify(msg)}`);
                    break;
                case GQL.COMPLETE:
                    if (Number(msg.id) !== this._operationId) {
                        // this.log(`Complete message contains unexpected id and will be ignored.\n${JSON.stringify(msg)}`);
                        return;
                    }
                    this.log('Received complete message. Closing connection.');
                    this.close();
                    this.cancelTimeouts(this._timerConnect);
                    const delay = this.getRandomInt(60000);
                    this.connectWithDelayWorker(delay);
                    break;

                default:
                    this.warn(`Unrecognized message type: ${JSON.stringify(msg)}`);
                    break;
            }
        }
    };

    /**
     * Event: onWebSocketError
     * Called when an error has occurred.
     * @param {WebSocket.ErrorEvent} event Error event
     */
    private onWebSocketError(event: WebSocket.ErrorEvent) {
        this.error(`An error occurred: ${JSON.stringify(event)}`);
        this.close();
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
