import * as url from 'url';
import https, { RequestOptions } from 'https';
import http from 'http';
import { IConfig } from '../models/IConfig';
import { IHome } from '../models/IHome';
import { IPrice } from '../models/IPrice';
import { EnergyResolution } from '../models/enums/EnergyResolution';
import { IConsumption } from '../models/IConsumption';
import { gqlHomesConsumption, gqlHomeConsumption } from '../gql/consumption.gql';
import { gqlHomes, gqlHomesComplete } from '../gql/homes.gql';
import { gqlHome, gqlHomeComplete } from '../gql/home.gql';
import { gqlCurrentEnergyPrice, gqlTodaysEnergyPrices, gqlTomorrowsEnergyPrices, gqlCurrentEnergyPrices } from '../gql/energy.gql';
import { HttpMethod } from './models/HttpMethod';
import { gqlSendPushNotification } from '../gql/sendPushNotification.gql';
import { ISendPushNotification } from '../models/ISendPushNotification';
import { AppScreen } from '../models/enums/AppScreen';
import { qglWebsocketSubscriptionUrl } from '../gql/websocketSubscriptionUrl';
import { ITibberQuery } from './ITibberQuery';

export class TibberQuery implements ITibberQuery {
    public active: boolean;
    private _config: IConfig;
    public get config(): IConfig {
        return this._config;
    }
    public set config(value: IConfig) {
        this._config = value;
    }

    /**
     * Constructor
     * Create an instace of TibberQuery class
     * @param config IConfig object
     * @see IConfig
     */
    constructor(config: IConfig) {
        this.active = false;
        this._config = config;
    }

    /**
     * Try to parse a string and return a valid JSON object. 
     * If string is not valid JSON, it will return an empty object instead.
     * @param input Input string to try to parse as a JSON object
     * @returns Parsed or empty Json object
     */
    private JsonTryParse(input: string): object {
        try {
            //check if the string exists
            if (input) {
                let o = JSON.parse(input);

                //validate the result too
                if (o && o.constructor === Object) {
                    return o;
                }
            }
        }
        catch (e: any) {
        }

        return { responseMessage: input };
    };

    /**
     *
     * @param method HTTP method to use
     * @param uri Uri to use
     * @returns An object containing request options
     */
    private getRequestOptions(method: HttpMethod, uri: url.UrlWithParsedQuery): RequestOptions {
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
                'User-Agent': 'tibber-api',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this._config.endpoint.apiKey}`,
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
        const node: TibberQuery = this;
        return await new Promise<any>((resolve, reject) => {
            try {
                const uri = url.parse(this._config.endpoint.url, true);
                const options: RequestOptions = node.getRequestOptions(HttpMethod.Post, uri);
                const data = new TextEncoder().encode(
                    JSON.stringify({
                        query,
                        variables,
                    }),
                );

                const client = (uri.protocol == "https:") ? https : http;
                const req = client.request(options, (res: any) => {
                    let str: string = '';
                    res.on('data', (chunk: string) => {
                        str += chunk;
                    });
                    res.on('end', () => {
                        const response: any = this.JsonTryParse(str);
                        if (res?.statusCode >= 200 && res?.statusCode < 300) {
                            resolve(response.data ? response.data : response);
                        } else {
                            response.httpCode = res?.statusCode;
                            response.statusCode = res?.statusCode;
                            response.statusMessage = res?.statusMessage;
                            reject(response);
                        }
                    });
                });
                req.on('error', (e: any) => {
                    // console.error(`problem with request: ${e.message}`);
                    reject(e);
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
    public async getWebsocketSubscriptionUrl(): Promise<URL> {
        const result = await this.query(qglWebsocketSubscriptionUrl);
        if (result && result.viewer && result.viewer.websocketSubscriptionUrl) {
            return new URL(result.viewer.websocketSubscriptionUrl);
        }
        return result && result.error ? result : {};
    }

    /**
     * Get selected home with some selected properties, including address and owner.
     * @param homeId Tibber home ID
     * @return IHome object
     */
    public async getHome(homeId: string): Promise<IHome> {
        const variables = { homeId };
        const result = await this.query(gqlHome, variables);
        if (result && result.viewer && result.viewer.home) {
            return Object.assign({} as IHome, result.viewer.home);
        }
        return result && result.error ? result : {};
    }

    /**
     * Get homes with all properties, including energy price, consumption and production.
     * @param homeId Tibber home ID
     * @return IHome object
     */
    public async getHomeComplete(homeId: string): Promise<IHome> {
        const variables = { homeId };
        const result = await this.query(gqlHomeComplete, variables);
        if (result && result.viewer && result.viewer.home) {
            return Object.assign({} as IHome, result.viewer.home);
        }
        return result && result.error ? result : {};
    }

    /**
     * Get homes with some selected properties, including address and owner.
     * @return Array of IHome.
     */
    public async getHomes(): Promise<IHome[]> {
        const result = await this.query(gqlHomes);
        if (result && result.viewer && Array.isArray(result.viewer.homes)) {
            return Object.assign([] as IHome[], result.viewer.homes);
        }
        return result && result.error ? result : {};
    }

    /**
     * Get homes with all properties, including energy price, consumption and production.
     * @return Array of IHome
     */
    public async getHomesComplete(): Promise<IHome[]> {
        const result = await this.query(gqlHomesComplete);
        if (result && result.viewer && Array.isArray(result.viewer.homes)) {
            return Object.assign([] as IHome[], result.viewer.homes);
        }
        return result && result.error ? result : {};
    }

    /**
     * Get current energy price for selected home.
     * @param homeId Tibber home ID
     * @return IPrice object
     */
    public async getCurrentEnergyPrice(homeId: string): Promise<IPrice> {
        const variables = { homeId };
        const result = await this.query(gqlCurrentEnergyPrice, variables);
        if (result && result.viewer && result.viewer.home) {
            const home: IHome = result.viewer.home;
            return Object.assign(
                {} as IPrice,
                home.currentSubscription && home.currentSubscription.priceInfo ? home.currentSubscription.priceInfo.current : {},
            );
        }
        return result && result.error ? result : {};
    }

    /**
     * Get current energy prices from all homes registered to current user
     * @return Array of IPrice
     */
    public async getCurrentEnergyPrices(): Promise<IPrice[]> {
        const result = await this.query(gqlCurrentEnergyPrices);
        if (result && result.viewer && Array.isArray(result.viewer.homes)) {
            const homes: IHome[] = result.viewer.homes;
            const prices = homes.map((item: IHome) => {
                if (item && item.currentSubscription && item.currentSubscription.priceInfo && item.currentSubscription.priceInfo.current) {
                    const price = item.currentSubscription.priceInfo.current;
                    price.homeId = item.id;
                    return price;
                }
            });
            return Object.assign([] as IPrice[], prices);
        }
        return result && result.error ? result : {};
    }

    /**
     * Get energy prices for today.
     * @param homeId Tibber home ID
     * @return Array of IPrice
     */
    public async getTodaysEnergyPrices(homeId: string): Promise<IPrice[]> {
        const variables = { homeId };
        const result = await this.query(gqlTodaysEnergyPrices, variables);
        if (result && result.viewer && result.viewer.home) {
            const data: IHome = result.viewer.home;
            return Object.assign(
                [] as IPrice[],
                data.currentSubscription && data.currentSubscription.priceInfo ? data.currentSubscription.priceInfo.today : {},
            );
        }
        return result && result.error ? result : {};
    }

    /**
     * Get energy prices for tomorrow. These will only be available between 12:00 and 23:59
     * @param homeId Tibber home ID
     * @return Array of IPrice
     */
    public async getTomorrowsEnergyPrices(homeId: string): Promise<IPrice[]> {
        const variables = { homeId };
        const result = await this.query(gqlTomorrowsEnergyPrices, variables);
        if (result && result.viewer && result.viewer.home) {
            const data: IHome = result.viewer.home;
            return Object.assign(
                [] as IPrice[],
                data.currentSubscription && data.currentSubscription.priceInfo ? data.currentSubscription.priceInfo.tomorrow : {},
            );
        }
        return result && result.error ? result : {};
    }

    /**
     * Get energy consumption for one or more homes.
     * Returns an array of IConsumption
     * @param resolution EnergyResolution. Valid values: HOURLY, DAILY, WEEKLY, MONTHLY, ANNUAL
     * @param lastCount Return the last number of records
     * @param homeId Tibber home ID. Optional parameter. Empty parameter will return all registered homes.
     * @return Array of IConsumption
     */
    public async getConsumption(resolution: EnergyResolution, lastCount: number, homeId?: string): Promise<IConsumption[]> {
        const variables = { homeId, resolution, lastCount };
        if (homeId) {
            const result = await this.query(gqlHomeConsumption, variables);
            if (result && result.viewer && result.viewer.home) {
                const home: IHome = result.viewer.home;
                return Object.assign([] as IConsumption[], home.consumption ? home.consumption.nodes : []);
            }
            return result && result.error ? result : { error: 'An error occurred while loadnig consumption.' };
        } else {
            const result = await this.query(gqlHomesConsumption, variables);
            if (result && result.viewer && Array.isArray(result.viewer.homes)) {
                const consumptions = result.viewer.homes.map((item: IHome) => {
                    const nodes = item.consumption.nodes.map((node: IConsumption) => {
                        node.homeId = item.id;
                        return node;
                    });
                    return nodes;
                });
                return Object.assign([] as IConsumption[], consumptions);
            }
            return result && result.error ? result : { error: 'An error occurred while loadnig consumption.' };
        }
    }

    /**
     * Sends a push notification to the current user's tibber app.
     * Returns a ISendPushNotification Object
     * @param title: "The title of your message";
       @param message: "The message you want to send";
       @param screen: AppScreen Object, example: AppScreen.HOME ;
     * @return ISendPushNotification Object
     */
    public async sendPushNotification(message: string, title: string, screen: AppScreen): Promise<ISendPushNotification> {
        const messagePayloadVariables = {
            input: { title: title, message: message, screenToOpen: screen },
        };

        const result = await this.query(gqlSendPushNotification, messagePayloadVariables);

        if (result.sendPushNotification || result.errors) {
            return Object.assign({} as ISendPushNotification, result);
        } else return Object.assign({}, { errors: [{ message: 'Undefined error' }] } as ISendPushNotification);
    }
}
