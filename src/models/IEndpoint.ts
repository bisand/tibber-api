export interface IEndpoint {
    queryUrl: string;
    apiKey: string;
    /**
     * User agent string. Please comply with the RFC 7231 standard.
     * All text provided will be prepended with 'bisand/tibber-api/x.x.x' where x.x.x is the version of the library.
     * Once used in any instance of TibberQuery and TibberFeed, it will be sanitized and not change.
     * @example 'MyApp/1.0 (https://example.com)'
     * @returns 'MyApp/1.0 (https://example.com) bisand/tibber-api/x.x.x'
     * @default 'bisand/tibber-api/x.x.x'
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent}
     * @see {@link https://tools.ietf.org/html/rfc7231#section-5.5.3}
     * @see {@link https://tools.ietf.org/html/rfc7230#section-3.2.6}
     * @see {@link https://tools.ietf.org/html/rfc7230#section-5.5}
     *  */
    userAgent?: string;
}
