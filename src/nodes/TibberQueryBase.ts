import { IConfig } from '../models/IConfig'
import * as url from 'url'
import { HttpMethod } from './models/HttpMethod'
import { qglWebsocketSubscriptionUrl } from '../gql/websocketSubscriptionUrl'
import { gqlHomeRealTime } from '../gql/home.gql'
import { TimeoutError } from './models/TimeoutError'
import { HeaderManager } from '../tools/HeaderManager'

import { IncomingMessage, request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { parse as parseUrl } from 'url';
import { RequestOptions } from 'http';
import { TextEncoder } from 'util'; // available in Node 12+

export class TibberQueryBase {
    public active: boolean
    private _config: IConfig
    private _headerManager: HeaderManager

    private _requestTimeout: number

    public get requestTimeout(): number {
        return this._requestTimeout
    }
    public set requestTimeout(value: number) {
        this._requestTimeout = value
    }

    public get config(): IConfig {
        return this._config
    }
    public set config(value: IConfig) {
        this._config = value
    }

    /**
     *
     */
    constructor(config: IConfig, requestTimeout: number = 30000) {
        this.active = false
        this._config = config
        this._headerManager = new HeaderManager(config)
        this._requestTimeout = requestTimeout > 1000 ? requestTimeout : 1000
    }

    /**
     * Try to parse a string and return a valid JSON object.
     * If string is not valid JSON, it will return an empty object instead.
     * @param input Input string to try to parse as a JSON object
     * @returns Parsed or empty Json object
     */
    protected JsonTryParse(input: string): object {
        try {
            // check if the string exists
            if (input) {
                const o = JSON.parse(input)

                // validate the result too
                if (o && o.constructor === Object) {
                    return o
                }
            }
        }
        catch (e: any) {
            // TODO - Add logging.
        }

        return { responseMessage: input }
    }

    /**
     *
     * @param method HTTP method to use
     * @param uri Uri to use
     * @returns An object containing request options
     */
    protected getRequestOptions(method: HttpMethod, uri: url.UrlWithStringQuery): RequestOptions {
        return {
            method,
            hostname: uri.hostname,
            port: uri.port,
            path: uri.path,
            headers: {
                Accept: 'application/json',
                Host: uri.hostname as string,
                'User-Agent': this._headerManager.userAgent,
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this._config.apiEndpoint.apiKey}`,
            },
        };
    }

    /**
     * General GQL query
     * @param query GQL query.
     * @param variables Variables used by query parameter.
     * @return Query result as JSON data
     */
    public async query(query: string, variables?: object): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                const uri = parseUrl(this._config.apiEndpoint.queryUrl);
                const isHttps = uri.protocol === 'https:';
                const client = isHttps ? httpsRequest : httpRequest;

                const payload = JSON.stringify({ query, variables });
                const data = new TextEncoder().encode(payload);

                const options: RequestOptions = this.getRequestOptions(HttpMethod.Post, uri);
                const req = client(options, (res: IncomingMessage) => {
                    const chunks: Buffer[] = [];

                    res.on('data', (chunk: Buffer) => {
                        chunks.push(chunk);
                    });

                    res.on('end', () => {
                        const body = Buffer.concat(chunks).toString('utf-8');
                        const parsed: any = this.JsonTryParse(body);
                        const status = res.statusCode ?? 0;

                        if (status >= 200 && status < 300) {
                            resolve(parsed.data ?? parsed);
                        } else {
                            parsed.httpCode = status;
                            parsed.statusCode = res?.statusCode ?? 500;
                            parsed.statusMessage = res?.statusMessage ?? 'No response received';
                            if (!body) {
                                parsed.message = 'Empty response from server';
                            }
                            reject(parsed);
                        }
                    });
                });

                req.on('error', (err) => {
                    reject(err);
                });

                req.setTimeout(this._requestTimeout, () => {
                    req.destroy(new TimeoutError(`Request timeout for ${uri.href}`));
                });

                req.write(data);
                req.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Get selected home with some selected properties, including address and owner.
     * @param homeId Tibber home ID
     * @return IHome object
     */
    public async getWebsocketSubscriptionUrl(): Promise<url.URL> {
        const result = await this.query(qglWebsocketSubscriptionUrl)
        if (result && result.viewer && result.viewer.websocketSubscriptionUrl) {
            return new url.URL(result.viewer.websocketSubscriptionUrl)
        }
        throw new Error(
            result && result.error
                ? `Failed to get websocket subscription URL: ${result.error}`
                : 'Websocket subscription URL not found in response'
        )
    }

    /**
     * Get selected home with some selected properties, including address and owner.
     * @param homeId Tibber home ID
     * @return IHome object
     */
    public async getRealTimeEnabled(homeId: string): Promise<boolean> {
        const variables = { homeId }
        const result = await this.query(gqlHomeRealTime, variables)
        return result?.viewer?.home?.features?.realTimeConsumptionEnabled ?? false
    }
}
