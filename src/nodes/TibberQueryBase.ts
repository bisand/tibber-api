import { IConfig } from '../models/IConfig';
import * as url from 'url';
import https, { RequestOptions } from 'https';
import http, { IncomingMessage } from 'http';
import { HttpMethod } from './models/HttpMethod';
import { qglWebsocketSubscriptionUrl } from '../gql/websocketSubscriptionUrl';
import { version } from "../../Version"
import { gqlHomeRealTime } from '../gql/home.gql';
import { TimeoutError } from './models/TimeoutError';

export class TibberQueryBase {
    public active: boolean;
    private _config: IConfig;
    private _requestTimeout: number;

    public get requestTimeout(): number {
        return this._requestTimeout;
    }
    public set requestTimeout(value: number) {
        this._requestTimeout = value;
    }

    public get config(): IConfig {
        return this._config;
    }
    public set config(value: IConfig) {
        this._config = value;
    }

    /**
     *
     */
    constructor(config: IConfig, requestTimeout: number = 30000) {
        this.active = false;
        this._config = config;
        this._requestTimeout = requestTimeout;
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
                const o = JSON.parse(input);

                // validate the result too
                if (o && o.constructor === Object) {
                    return o;
                }
            }
        }
        catch (e: any) {
            // TODO: Add logging.
        }

        return { responseMessage: input };
    };

    /**
     *
     * @param method HTTP method to use
     * @param uri Uri to use
     * @returns An object containing request options
     */
    protected getRequestOptions(method: HttpMethod, uri: url.UrlWithParsedQuery): RequestOptions {
        return {
            host: uri.host,
            port: uri.port,
            path: uri.path,
            protocol: uri.protocol,
            method,
            headers: {
                Connection: 'Keep-Alive',
                Accept: 'application/json',
                Host: uri.hostname as string,
                'User-Agent': (`${this._config.apiEndpoint.userAgent ?? ''} bisand/tibber-api/${version}`).trim(),
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
        return await new Promise<any>((resolve, reject) => {
            try {
                const uri = url.parse(this._config.apiEndpoint.queryUrl, true);
                const options: RequestOptions = this.getRequestOptions(HttpMethod.Post, uri);
                const data = new TextEncoder().encode(
                    JSON.stringify({
                        query,
                        variables,
                    }),
                );

                const client = (uri.protocol === "https:") ? https : http;
                const req: http.ClientRequest = client.request(options, (res: IncomingMessage) => {
                    let str: string = '';
                    res.on('data', (chunk: string) => {
                        str += chunk;
                    });
                    res.on('end', () => {
                        const response: any = this.JsonTryParse(str);
                        const statusCode: number = Number(res?.statusCode);
                        if (statusCode >= 200 && statusCode < 300) {
                            resolve(response.data ? response.data : response);
                        } else {
                            response.httpCode = res?.statusCode;
                            response.statusCode = res?.statusCode;
                            response.statusMessage = res?.statusMessage;
                            reject(response);
                        }
                        req.destroy();
                    });
                });
                req.on('error', (e: any) => {
                    reject(e);
                });
                req.setTimeout(this._requestTimeout, () => {
                    req.destroy(new TimeoutError(`Request imeout for uri ${uri}`));
                });
                if (data) {
                    req.write(data);
                }
                req.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Get selected home with some selected properties, including address and owner.
     * @param homeId Tibber home ID
     * @return IHome object
     */
    public async getWebsocketSubscriptionUrl(): Promise<url.URL> {
        const result = await this.query(qglWebsocketSubscriptionUrl);
        if (result && result.viewer && result.viewer.websocketSubscriptionUrl) {
            return new url.URL(result.viewer.websocketSubscriptionUrl);
        }
        return result && result.error ? result : {};
    }

    /**
     * Get selected home with some selected properties, including address and owner.
     * @param homeId Tibber home ID
     * @return IHome object
     */
    public async getRealTimeEnabled(homeId: string): Promise<boolean> {
        const variables = { homeId };
        const result = await this.query(gqlHomeRealTime, variables);
        if (result && result.viewer && result.viewer.home) {
            return result?.viewer?.home?.features?.realTimeConsumptionEnabled ?? false;
        }
        return false;
    }
}
