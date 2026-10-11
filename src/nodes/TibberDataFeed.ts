import { ClientRequest } from 'http';
import { EventEmitter } from 'events';
import { Readable } from 'stream';
import { IDataStreamError } from '../models/data/IDataLiveMeasurement';
import { jsonTryParse, openHttpStream } from '../tools/HttpClient';
import { TibberData } from './TibberData';
import { TibberDataError } from './models/TibberDataError';

export class TibberDataFeed extends EventEmitter {
    public static readonly MAX_DEVICES = 5;

    private _tibberData: TibberData;
    private _homeId: string;
    private _deviceIds: string[];
    private _feedIdleTimeout: number;

    private _active: boolean = false;
    private _isConnected: boolean = false;
    private _request?: ClientRequest;
    private _reconnectTimer?: NodeJS.Timeout;
    private _idleTimer?: NodeJS.Timeout;
    private _connectionAttempts: number = 0;
    private _tokenRefreshed: boolean = false;
    private _backoffDelayBase: number = 1000; // 1 second
    private _backoffDelayMax: number = 1000 * 60 * 10; // 10 minutes

    /**
     * Constructor for creating a new instance of TibberDataFeed.
     * Streams live measurements from Tibber Pulse and Watty through the Tibber Data API.
     * Only one feed per home can be open at a time. Opening a second one closes the first.
     * @constructor
     * @param {TibberData} tibberData TibberData object. The access token needs the scope data-api-meters-read.
     * @param {string} homeId Tibber home ID
     * @param {string[]} deviceIds IDs from TibberData.getLiveEventDevices, not the device IDs from getDevices. Min 1, max 5.
     * @param {number} timeout Feed idle timeout in milliseconds. The feed will reconnect after being idle for more than the specified number of milliseconds. Min 30000 ms, as the server sends a ping every 20 seconds.
     * @see {@linkcode TibberData}
     */
    constructor(tibberData: TibberData, homeId: string, deviceIds: string[], timeout: number = 60000) {
        super();

        if (!tibberData || !(tibberData instanceof TibberData)) {
            throw new Error('Missing mandatory parameter [tibberData]');
        }
        if (!homeId || !Array.isArray(deviceIds) || deviceIds.length < 1 || deviceIds.length > TibberDataFeed.MAX_DEVICES) {
            throw new Error(`Missing mandatory parameters [homeId, deviceIds]. Between 1 and ${TibberDataFeed.MAX_DEVICES} device IDs are required.`);
        }

        this._tibberData = tibberData;
        this._homeId = homeId;
        this._deviceIds = deviceIds;
        this._feedIdleTimeout = timeout > 30000 ? timeout : 30000;
    }

    get active(): boolean {
        return this._active;
    }

    get connected(): boolean {
        return this._isConnected;
    }

    get feedIdleTimeout(): number {
        return this._feedIdleTimeout;
    }

    /**
     * Connect to the live measurement feed and keep it connected until close is called.
     */
    public async connect(): Promise<void> {
        if (this._active) {
            return;
        }
        this._active = true;
        this._connectionAttempts = 0;
        this._tokenRefreshed = false;
        await this.open();
    }

    /**
     * Close the live measurement feed.
     */
    public close() {
        this._active = false;
        this.disconnect();
        this.log('Closed Tibber Data Feed.');
    }

    /**
     * Open the event stream.
     */
    private async open(): Promise<void> {
        clearTimeout(this._reconnectTimer);
        if (!this._active || this._request) {
            return;
        }

        const url = new URL(`/v1/homes/${encodeURIComponent(this._homeId)}/live-events`, this._tibberData.apiUrl);
        this._deviceIds.forEach((deviceId) => url.searchParams.append('deviceId', deviceId));

        let request: ClientRequest | undefined;
        try {
            const accessToken = await this._tibberData.getAccessToken();
            if (!this._active || this._request) {
                return;
            }
            this.log('Connecting...');
            this.emit('connecting', { connection_attempt: this._connectionAttempts });

            const { req, response } = openHttpStream({
                method: 'GET',
                url: url.href,
                headers: {
                    Accept: 'text/event-stream',
                    Authorization: `Bearer ${accessToken}`,
                    'User-Agent': this._tibberData.userAgent,
                },
                timeout: this._feedIdleTimeout,
            });
            request = this._request = req;
            const { res, stream } = await response;
            if (request !== this._request) {
                stream.destroy();
                return;
            }

            const status = res.statusCode ?? 0;
            if (status !== 200) {
                const chunks: Buffer[] = [];
                for await (const chunk of stream) {
                    chunks.push(chunk as Buffer);
                }
                if (request === this._request) {
                    this.handleHttpError(status, Buffer.concat(chunks).toString('utf-8'), res.headers['retry-after']);
                }
                return;
            }

            this._isConnected = true;
            this.resetIdleTimer();
            this.emit('connected', 'Connected to Tibber data feed.');
            this.readStream(request, stream);
        } catch (error) {
            if (request && request !== this._request) {
                return;
            }
            this.error(error);
            this.disconnect();
            // A rejected token refresh will not succeed by trying again.
            if (error instanceof TibberDataError && error.status !== 429 && error.status < 500) {
                this._active = false;
                return;
            }
            this.reconnect();
        }
    }

    /**
     * Read Server-Sent Events from the stream until it ends.
     */
    private readStream(request: ClientRequest, stream: Readable) {
        let buffer = '';
        let event = '';
        let data: string[] = [];

        stream.setEncoding('utf-8');
        stream.on('data', (chunk: string) => {
            if (request !== this._request) {
                return;
            }
            this.resetIdleTimer();
            buffer += chunk;
            const lines = buffer.split(/\r\n|\r|\n/);
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                if (line === '') {
                    if (event || data.length > 0) {
                        this.handleEvent(event || 'message', data.join('\n'));
                    }
                    event = '';
                    data = [];
                } else if (line.startsWith('event:')) {
                    event = line.substring(6).trim();
                } else if (line.startsWith('data:')) {
                    data.push(line.substring(5).replace(/^ /, ''));
                }
                if (request !== this._request) {
                    return;
                }
            }
        });
        const onEnd = (error?: Error) => {
            if (request !== this._request) {
                return;
            }
            if (error) {
                this.error(error);
            }
            this.disconnect();
            this.reconnect();
        };
        stream.on('error', onEnd);
        stream.on('close', () => onEnd());
    }

    private handleEvent(event: string, data: string) {
        switch (event) {
            case 'measurement': {
                const measurement = jsonTryParse(data);
                if (!measurement) {
                    this.warn(`Unable to parse measurement: ${data}`);
                    return;
                }
                this._connectionAttempts = 0;
                this._tokenRefreshed = false;
                this.emit('data', measurement);
                break;
            }
            case 'ping':
                this.emit('ping');
                break;
            case 'stream_error': {
                const streamError: IDataStreamError = jsonTryParse(data) ?? { code: 'unknown', transient: true };
                this.emit('stream_error', streamError);
                this.disconnect();
                if (streamError.transient) {
                    this.warn(`Stream error: ${streamError.code}. Reconnecting.`);
                    this.reconnect(streamError.retryAfter);
                } else {
                    // Reconnecting after being evicted would evict the connection that replaced this one.
                    this._active = false;
                    this.error(`Stream error: ${streamError.code}. The feed has been closed.`);
                }
                break;
            }
            default:
                this.warn(`Unrecognized event type: ${event}`);
                break;
        }
    }

    private handleHttpError(status: number, body: string, retryAfter?: string) {
        const problem = jsonTryParse(body);
        const reason = problem?.detail ?? problem?.title ?? `HTTP ${status}`;
        this.disconnect();
        if (status === 401 && !this._tokenRefreshed) {
            // The access token may have expired. Try once with a fresh one.
            this._tokenRefreshed = true;
            this._tibberData.getAccessToken(true).then(
                () => this.open(),
                (error) => {
                    this._active = false;
                    this.error(error);
                },
            );
        } else if (status === 429 || status >= 500) {
            this.warn(`Unable to connect: ${reason}. Reconnecting.`);
            this.reconnect(retryAfter);
        } else {
            this._active = false;
            this.error(`Unable to connect: ${reason}. The feed has been closed.`);
        }
    }

    /**
     * Close the event stream and release its resources.
     */
    private disconnect() {
        clearTimeout(this._reconnectTimer);
        clearTimeout(this._idleTimer);
        const request = this._request;
        const wasConnected = this._isConnected;
        this._request = undefined;
        this._isConnected = false;
        request?.destroy();
        if (wasConnected) {
            this.emit('disconnected', 'Disconnected from Tibber data feed.');
        }
    }

    /**
     * Open the event stream again after a delay, if the feed is still active.
     * @param retryAfter Delay requested by the server, in seconds
     */
    private reconnect(retryAfter?: string | number) {
        if (!this._active) {
            return;
        }
        const delay = this.getReconnectDelay(retryAfter);
        this._connectionAttempts++;
        this.log(`Reconnecting in ${Math.ceil(delay / 1000)} seconds.`);
        this._reconnectTimer = setTimeout(() => this.open(), delay);
    }

    protected getReconnectDelay(retryAfter?: string | number): number {
        return Math.max(TibberData.getRetryDelay(this._connectionAttempts, retryAfter, this._backoffDelayBase * 2, this._backoffDelayMax), this._backoffDelayBase);
    }

    private resetIdleTimer() {
        clearTimeout(this._idleTimer);
        this._idleTimer = setTimeout(() => {
            this.warn(`Connection timed out after ${this._feedIdleTimeout} ms.`);
            this.emit('heartbeat_timeout', { timeout: this._feedIdleTimeout });
            this.disconnect();
            this.reconnect();
        }, this._feedIdleTimeout);
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
