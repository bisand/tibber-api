import { version } from '../../Version';
import { IConfig } from '../models/IConfig';

export class HeaderManager {
    private _userAgent: string | null = null;
    private _config: IConfig;

    /**
     * Constructor
     * Create an instance of TibberBase class
     * @param {IConfig} config Config object
     * @see IConfig
     */
    constructor(config: IConfig) {
        this._config = config;
    }

    /**
     * Gets the User-Agent from apiEndpoint and ensures it is not changed once set.
     */
    public get userAgent(): string {
        if (this._userAgent === null) {
            this._userAgent = this.sanitizeUserAgent(`${this._config.apiEndpoint.userAgent ?? ''} bisand/tibber-api/${version}`).trim();
        }
        return this._userAgent;
    }

    /**
     * Sanitize User-Agent string.
     *  - Remove all characters that are not allowed in User-Agent.
     *  - Limit the length to 255 characters.
     * @param {string} userAgent User-Agent string to sanitize.
     * @returns {string} Sanitized User-Agent string.
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent}
     * @see {@link https://tools.ietf.org/html/rfc7231#section-5.5.3}
     * @see {@link https://tools.ietf.org/html/rfc7230#section-3.2.6}
     * @see {@link https://tools.ietf.org/html/rfc7230#section-5.5}
     *  */
    private sanitizeUserAgent(userAgent: string): string {
        const sanitized = userAgent.replace(/[^a-zA-Z0-9\-._~!#$&'()*+,;=:@ ]/g, '');
        return sanitized.length > 255 ? sanitized.substring(0, 255) : sanitized;
    }
}