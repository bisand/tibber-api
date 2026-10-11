import { IDataConfig } from '../models/data/IDataConfig';
import { IDataDevice, IDataDeviceItem } from '../models/data/IDataDevice';
import { IDataDeviceHistory, IDataDeviceHistoryOptions } from '../models/data/IDataDeviceHistory';
import { IDataHome } from '../models/data/IDataHome';
import { IDataLiveEventDevice } from '../models/data/IDataLiveMeasurement';
import { ITokenSet } from '../models/data/ITokenSet';
import { HeaderManager } from '../tools/HeaderManager';
import { httpRequestAsync, jsonTryParse } from '../tools/HttpClient';
import { TibberDataError } from './models/TibberDataError';

export class TibberData {
    public static readonly DEFAULT_API_URL = 'https://data-api.tibber.com';
    // Refresh the access token this long before it expires.
    private static readonly TOKEN_EXPIRY_MARGIN = 60000;

    private _config: IDataConfig;
    private _headerManager: HeaderManager;
    private _tokens?: ITokenSet;
    private _refreshing?: Promise<ITokenSet>;

    public get config(): IDataConfig {
        return this._config;
    }

    /**
     * The tokens currently in use.
     */
    public get tokens(): ITokenSet | undefined {
        return this._tokens;
    }

    public get apiUrl(): string {
        return this._config.apiUrl ?? TibberData.DEFAULT_API_URL;
    }

    public get userAgent(): string {
        return this._headerManager.userAgent;
    }

    /**
     * Constructor
     * Create an instance of TibberData, used to query the Tibber Data API for devices paired to Tibber.
     * @param {IDataConfig} config Config object. Either accessToken or tokens is required.
     * @see IDataConfig
     */
    constructor(config: IDataConfig) {
        this._tokens = config?.tokens ?? (config?.accessToken ? { accessToken: config.accessToken } : undefined);
        if (!this._tokens?.accessToken) {
            throw new Error('Missing mandatory parameter [accessToken or tokens]');
        }
        this._config = config;
        this._headerManager = new HeaderManager({ active: false, apiEndpoint: { apiKey: '', queryUrl: '', userAgent: config.userAgent } });
    }

    /**
     * Get a valid access token. It is refreshed first if it has expired and a refresh is possible.
     * @param forceRefresh Refresh even if the token has not expired
     * @return Access token
     */
    public async getAccessToken(forceRefresh: boolean = false): Promise<string> {
        const tokens = this._tokens as ITokenSet;
        const expired = tokens.expiresAt !== undefined && Date.now() > tokens.expiresAt - TibberData.TOKEN_EXPIRY_MARGIN;
        if ((forceRefresh || expired) && this.canRefresh) {
            return (await this.refreshTokens()).accessToken;
        }
        return tokens.accessToken;
    }

    private get canRefresh(): boolean {
        return !!this._config.oauth && !!this._tokens?.refreshToken;
    }

    private refreshTokens(): Promise<ITokenSet> {
        // Refresh tokens can be single use, so concurrent callers share one refresh.
        if (!this._refreshing) {
            this._refreshing = (async () => {
                try {
                    const tokens = await (this._config.oauth as NonNullable<IDataConfig['oauth']>).refresh(this._tokens?.refreshToken as string);
                    this._tokens = tokens;
                    await this._config.onTokensRefreshed?.(tokens);
                    return tokens;
                } finally {
                    this._refreshing = undefined;
                }
            })();
        }
        return this._refreshing;
    }

    /**
     * General GET request to the Data API.
     * Retries with backoff on 429 and 5xx, and refreshes the access token once on 401.
     * @param path Path such as /v1/homes, or a link returned by the API
     * @return Response as JSON data
     */
    public async get(path: string): Promise<any> {
        const url = new URL(path, this.apiUrl);
        if (url.origin !== new URL(this.apiUrl).origin) {
            throw new Error(`Refusing to send access token to ${url.origin}`);
        }
        const maxRetries = this._config.maxRetries ?? 5;
        let refreshed = false;
        for (let attempt = 0; ; attempt++) {
            const response = await httpRequestAsync({
                method: 'GET',
                url: url.href,
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${await this.getAccessToken()}`,
                    'User-Agent': this._headerManager.userAgent,
                },
                timeout: this._config.requestTimeout ?? 30000,
            });
            const body = jsonTryParse(response.body);
            if (response.status >= 200 && response.status < 300) {
                return body;
            }
            if (response.status === 401 && !refreshed && this.canRefresh) {
                refreshed = true;
                await this.refreshTokens();
                continue;
            }
            const retryAfter = response.headers['retry-after'];
            const transient = response.status === 429 || response.status >= 500;
            if (!transient || attempt >= maxRetries) {
                const reason = body?.detail ?? body?.title ?? `HTTP ${response.status}`;
                throw new TibberDataError(`Request failed for ${url.pathname}: ${reason}`, response.status, body ?? response.body, retryAfter);
            }
            await this.sleep(TibberData.getRetryDelay(attempt, retryAfter));
        }
    }

    /**
     * Delay before a retry. Uses the Retry-After header if present, otherwise exponential backoff with full jitter.
     * @param attempt Number of attempts made so far, starting at 0
     * @param retryAfter Value of the Retry-After header, in seconds or as a HTTP date
     * @param baseMs Initial delay in milliseconds
     * @param maxMs Maximum delay in milliseconds
     * @returns {number} Delay in milliseconds
     */
    public static getRetryDelay(attempt: number, retryAfter?: string | number, baseMs: number = 400, maxMs: number = 15000): number {
        if (retryAfter !== undefined && retryAfter !== '') {
            const seconds = Number(retryAfter);
            const ms = Number.isNaN(seconds) ? new Date(retryAfter).getTime() - Date.now() : seconds * 1000;
            if (!Number.isNaN(ms)) {
                return Math.max(ms, 0) + Math.random() * 250;
            }
        }
        return Math.random() * Math.min(baseMs * Math.pow(2, attempt), maxMs);
    }

    protected sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Get the homes the user has access to.
     * @return Array of IDataHome
     */
    public async getHomes(): Promise<IDataHome[]> {
        const result = await this.get('/v1/homes');
        return result?.homes ?? [];
    }

    /**
     * Get the devices in a home. Only devices covered by the scopes of the access token are returned.
     * @param homeId Tibber home ID
     * @return Array of IDataDeviceItem
     */
    public async getDevices(homeId: string): Promise<IDataDeviceItem[]> {
        const result = await this.get(`/v1/homes/${encodeURIComponent(homeId)}/devices`);
        return result?.devices ?? [];
    }

    /**
     * Get a device with its attributes and current capabilities.
     * @param homeId Tibber home ID
     * @param deviceId Device ID from getDevices
     * @return IDataDevice object
     */
    public async getDevice(homeId: string, deviceId: string): Promise<IDataDevice> {
        return this.get(`/v1/homes/${encodeURIComponent(homeId)}/devices/${encodeURIComponent(deviceId)}`);
    }

    /**
     * Get the first page of history for a device. Use getDeviceHistoryPage with next or prev to get more.
     * Only devices with resolutions in supportedHistory have history.
     * @param homeId Tibber home ID
     * @param deviceId Device ID from getDevices
     * @param options Resolution and either since or until
     * @return IDataDeviceHistory object
     */
    public async getDeviceHistory(homeId: string, deviceId: string, options: IDataDeviceHistoryOptions): Promise<IDataDeviceHistory> {
        const toIso = (value: string | Date) => (value instanceof Date ? value.toISOString() : value);
        const query = new URLSearchParams({ resolution: options.resolution });
        if (options.since) {
            query.set('since', toIso(options.since));
        }
        if (options.until) {
            query.set('until', toIso(options.until));
        }
        return this.get(`/v1/homes/${encodeURIComponent(homeId)}/devices/${encodeURIComponent(deviceId)}/history?${query}`);
    }

    /**
     * Get another page of device history.
     * @param link The next or prev link from a previous IDataDeviceHistory
     * @return IDataDeviceHistory object
     */
    public async getDeviceHistoryPage(link: string): Promise<IDataDeviceHistory> {
        return this.get(link);
    }

    /**
     * Get the devices in a home that can stream live measurements right now.
     * Requires the scope data-api-meters-read, otherwise the list is empty.
     * @param homeId Tibber home ID
     * @return Array of IDataLiveEventDevice
     */
    public async getLiveEventDevices(homeId: string): Promise<IDataLiveEventDevice[]> {
        const result = await this.get(`/v1/homes/${encodeURIComponent(homeId)}/live-events/devices`);
        return result?.devices ?? [];
    }
}
