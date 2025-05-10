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
    private _maxFailedConnectionAttempts: number;
    private _timeoutCount: number;
    private _webSocketFactory: ((url: string, protocols: string[], options: any) => WebSocket) | undefined;

    private _timeouts = new Map<string, NodeJS.Timeout>();
    private _lastConnectedAt: number;
    private _rateLimitUntil: number = 0; // timestamp until which we should not reconnect

    /// <summary>
    ///     Number of timeouts that have been created.
    /// </summary>
    public get timeoutCount(): number {
        return this._timeoutCount;
    }

    /// <summary>
    ///     The number of connection attempts that can be made before a hard reset is performed.
    ///     This is used to prevent the feed from trying to connect indefinitely.
    ///     The default value is 10.
    ///     You can tune this value to your needs.
    /// </summary>
    public get maxFailedConnectionAttempts(): number {
        return this._maxFailedConnectionAttempts;
    }
    public set maxFailedConnectionAttempts(value: number) {
        this._maxFailedConnectionAttempts = value;
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
    constructor(tibberQuery: TibberQueryBase, timeout: number = 60000, returnAllFields: boolean = false, connectionTimeout: number = 30000, webSocketFactory?: (url: string, protocols: string[], options: any) => WebSocket) {
        super();

        if (!tibberQuery || !(tibberQuery instanceof TibberQueryBase)) {
            throw new Error('Missing mandatory parameter [tibberQuery]');
        }

        this._webSocketFactory = webSocketFactory;
        this._feedConnectionTimeout = connectionTimeout > 5000 ? connectionTimeout : 5000;
        this._feedIdleTimeout = timeout > 5000 ? timeout : 5000;
        this._tibberQuery = tibberQuery;
        this._config = tibberQuery.config;
        this._headerManager = new HeaderManager(this._config);
        this._active = this._config.active;
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
        this._maxFailedConnectionAttempts = 10;
        this._lastConnectedAt = 0;

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
        return Date.now() > (this._lastRetry + this._retryBackoff);
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
        this.cancelTimeout('heartbeat');
        this.cancelTimeout('connect');
        this.cancelTimeout('connection_timeout');
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

        this.cancelTimeout('heartbeat');
        this.addTimeout('heartbeat', () => {
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
     * addTimeout
     * Adds a timeout to the list of timeouts.
     * @param {string} name Name of the timeout.
     * @param {() => void} fn Function to call when timeout is reached.
     * @param {number} ms Delay in milliseconds before callback will be called.
     */
    protected addTimeout(name: string, fn: () => void, ms: number): void {
        const existing = this._timeouts.get(name);
        if (existing) clearTimeout(existing);

        const timeout = setTimeout(fn, ms);
        this._timeouts.set(name, timeout);
    }

    /**
     * cancelTimeout
     * Cancels a timeout with the specified name.
     * @param name Name of the timeout to cancel.
     */
    protected cancelTimeout(name: string): void {
        const timeout = this._timeouts.get(name);
        if (timeout) {
            clearTimeout(timeout);
            this._timeouts.delete(name);
        }
    }

    /**
     * Connect to feed with built in delay, timeout and backoff.
     */
    private async connectWithTimeout(): Promise<void> {
        if (this._isConnecting || this._isConnected) return;

        // If we're in a rate limit cooldown, skip connection attempts
        if (Date.now() < this._rateLimitUntil) {
            const wait = this._rateLimitUntil - Date.now();
            this.warn(`Rate limited. Waiting ${Math.ceil(wait / 1000)} seconds before reconnecting.`);
            this.connectWithDelayWorker(wait + 1000);
            return;
        }

        this._isConnecting = true;
        try {
            if (!this.canConnect) {
                this.incrementFailedAttempts();
                return;
            }

            this._lastRetry = Date.now();

            if (this._isUnauthenticated) {
                this.error(`Unauthenticated! Invalid token. Please provide a valid token and try again.`);
                this.incrementFailedAttempts();
                this.updateBackoff();
                return;
            }

            if (this._realTimeConsumptionEnabled === null) {
                try {
                    const homeId = this._config.homeId ?? '';
                    this._realTimeConsumptionEnabled = await this._tibberQuery.getRealTimeEnabled(homeId);
                } catch (error: any) {
                    if (
                        error?.httpCode === 400 &&
                        Array.isArray(error?.errors) &&
                        error.errors.some((x: any) => x?.extensions?.code === 'UNAUTHENTICATED')
                    ) {
                        this._isUnauthenticated = true;
                        this.error(`Unauthenticated! Invalid token. Please provide a valid token and try again.`);
                    } else if (error?.httpCode === 429 || error?.statusCode === 429) {
                        // Too many requests: set a long backoff (e.g., 10 minutes)
                        const cooldown = 10 * 60 * 1000 + this.getRandomInt(60 * 1000); // 10-11 min
                        this._rateLimitUntil = Date.now() + cooldown;
                        this._retryBackoff = cooldown;
                        this.warn(`Received 429 Too Many Requests. Backing off for ${Math.round(cooldown / 1000)} seconds.`);
                        this.emit('rate_limited', { until: this._rateLimitUntil, cooldown });
                        // Only schedule a reconnect after the cooldown, then return
                        this.connectWithDelayWorker(cooldown + 1000);
                        return;
                    } else {
                        this.error(`Error checking real-time consumption status.\n${JSON.stringify(error)}`);
                    }
                    this.incrementFailedAttempts();
                    this.updateBackoff(error);
                    return;
                }
            }

            if (!this._realTimeConsumptionEnabled) {
                this.warn(`Unable to connect. Real Time Consumption is not enabled.`);
                this.incrementFailedAttempts();
                this.updateBackoff();
                return;
            }

            this.cancelTimeout('connect');
            this.cancelTimeout('connection_timeout');

            this.log('Connecting...');
            this.emit('connecting', {
                timeout: this._retryBackoff + this._backoffDelayBase,
                retryBackoff: this._retryBackoff
            });

            this.addTimeout('connection_timeout', () => {
                this.error('Connection timeout');
                this.emit('connection_timeout', { timeout: this._feedConnectionTimeout });

                if (this._webSocket) {
                    this.terminateConnection();
                }

                this.incrementFailedAttempts();
                this.updateBackoff();

                if (this._active) {
                    this.connectWithDelayWorker(this._retryBackoff);
                }
            }, this._feedConnectionTimeout);

            await this.internalConnect();
        } catch (error: any) {
            // Detect 429 Too Many Requests
            if (error?.httpCode === 429 || /429/.test(error?.message)) {
                const cooldown = Math.max(this._retryBackoff, 10 * 60 * 1000); // 10 minutes
                this._rateLimitUntil = Date.now() + cooldown;
                this._retryBackoff = cooldown;
                this.warn(`Received 429 Too Many Requests. Backing off for ${Math.ceil(cooldown / 1000)} seconds.`);
                this.emit('rate_limited', { until: this._rateLimitUntil, cooldown });
                // Only schedule a reconnect after the cooldown, then return
                this.connectWithDelayWorker(cooldown + 1000);
                return;
            }

            this.error(error);
            this.incrementFailedAttempts();
            this.updateBackoff(error);
            if (!this._isConnected && this._active) {
                this.connectWithDelayWorker(this._retryBackoff);
            }
        } finally {
            this._isConnecting = false;
        }
    }

    private updateBackoff(error?: any) {
        // If 429, don't increase attempts, just use the long backoff already set
        if (error?.httpCode === 429 || error?.statusCode === 429) {
            return;
        }
        if (this._retryBackoff < this._backoffDelayMax) {
            this._connectionAttempts++;
        }
        this._retryBackoff = this.getBackoffWithJitter(this._connectionAttempts);
    }

    private incrementFailedAttempts() {
        const now = Date.now();
        const STABLE_CONNECTION_THRESHOLD = 5 * 60 * 1000; // 5 minutes
        if (now - this._lastConnectedAt > STABLE_CONNECTION_THRESHOLD) {
            // Connection was stable, reset backoff
            this._connectionAttempts = 0;
            this._retryBackoff = this._backoffDelayBase;
        }
        this._failedAttempts++;
        if (this._failedAttempts >= this._maxFailedConnectionAttempts) {
            this.warn(`Max failed attempts (${this._maxFailedConnectionAttempts}) reached. Performing hard reset.`);
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
        this._lastRetry = 0;
        this.resetFailedAttempts();
        this.cancelTimeout('heartbeat');
        this.cancelTimeout('connect');
        this.cancelTimeout('connection_timeout');
        if (this._webSocket) {
            try {
                this._webSocket.terminate();
            } catch (e) { }
            this._webSocket = undefined as any;
        }
        // Wait for rate limit cooldown if set
        const now = Date.now();
        const delay = this._rateLimitUntil > now ? this._rateLimitUntil - now : 5000;
        if (this._active) {
            this.connectWithDelayWorker(delay);
        }
    }

    /**
     * Connect with a delay if the feed is still active.
     */
    private connectWithDelayWorker(delay?: number) {
        this.cancelTimeout('connect');
        if (!this._active) return;

        // Use the current backoff as the delay if not provided
        const nextDelay = delay !== undefined ? delay : this._retryBackoff;

        this.addTimeout('connect', async () => {
            try {
                if (this.canConnect) {
                    await this.connectWithTimeout();
                }
            } catch (error) {
                this.error(error);
            } finally {
                if (!this._isConnected && this._active) {
                    this.connectWithDelayWorker(this._retryBackoff);
                }
            }
        }, nextDelay);
    }

    /**
     * Internal connection method that handles the communication with tibber feed.
     */
    private async internalConnect(): Promise<void> {
        const { apiEndpoint } = this._config;
        if (!apiEndpoint || !apiEndpoint.apiKey) {
            const msg = 'Missing mandatory parameters: apiEndpoint or apiKey. Execution will halt.';
            this.error(msg);
            throw new Error(msg);
        }

        try {
            const url = await this._tibberQuery.getWebsocketSubscriptionUrl();
            const options = {
                headers: {
                    'Authorization': `Bearer ${apiEndpoint.apiKey}`,
                    'User-Agent': this._headerManager.userAgent,
                }
            };

            const ws = this._webSocketFactory
                ? this._webSocketFactory(url.href, ['graphql-transport-ws'], options)
                : new WebSocket(url.href, ['graphql-transport-ws'], options);

            this.attachWebSocketHandlers(ws);
            this._webSocket = ws;
        } catch (error) {
            this.error(error);
            throw error;
        }
    }

    private attachWebSocketHandlers(ws: WebSocket): void {
        ws.onopen = this.onWebSocketOpen.bind(this);
        ws.onmessage = this.onWebSocketMessage.bind(this);
        ws.onclose = this.onWebSocketClose.bind(this);
        ws.onerror = this.onWebSocketError.bind(this);
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
                    // this.close();
                    this.handleConnectionError();
                    break;
                case GQL.CONNECTION_ACK:
                    this._isConnected = true;
                    this._lastConnectedAt = Date.now(); // Track when we last connected
                    this.resetFailedAttempts();
                    this.cancelTimeout('connection_timeout');
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
                        return;
                    }
                    this.log('Received complete message. Closing connection.');
                    this.close();
                    this.cancelTimeout('connect');
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
        let errorMsg = 'An error occurred';
        if (event && typeof event === 'object') {
            if ('message' in event && event.message) {
                errorMsg += `: ${event.message}`;
            } else if ('error' in event && event.error) {
                errorMsg += `: ${event.error}`;
            } else if (Object.keys(event).length > 0) {
                errorMsg += `: ${JSON.stringify(event)}`;
            } else {
                errorMsg += ': [unknown websocket error]';
            }
        }
        this.error(errorMsg);

        if (!this._isClosing) {
            this.handleConnectionError();
        }
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

    private handleConnectionError() {
        this.terminateConnection();
        if (this._active) {
            // Only schedule a reconnect if not in rate limit cooldown
            if (Date.now() < this._rateLimitUntil) {
                const wait = this._rateLimitUntil - Date.now();
                this.warn(`Rate limited. Waiting ${Math.ceil(wait / 1000)} seconds before reconnecting.`);
                this.connectWithDelayWorker(wait + 1000);
            } else {
                this.connectWithDelayWorker(this._retryBackoff);
            }
        }
    }
}
