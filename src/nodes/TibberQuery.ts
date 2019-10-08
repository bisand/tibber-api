import { IConfig } from '../models/IConfig';
import { GraphQLClient } from 'graphql-request';
import { IHome } from '../models/IHome';
import { IPrice } from '../models/IPriceInfo';
import { EnergyResolution } from '../models/EnergyResolution';
import { IConsumption } from '../models/IConsumption';
import { gqlHomesConsumption, gqlHomeConsumption } from '../gql/consumption.gql';
import { gqlHomes, gqlHomesComplete } from '../gql/homes.gql';
import { gqlHome, gqlHomeComplete } from '../gql/home.gql';
import { gqlCurrentEnergyPrice, gqlTodaysEnergyPrices, gqlTomorrowsEnergyPrices, gqlCurrentEnergyPrices } from '../gql/energy.gql';

export class TibberQuery {
    public active: boolean;
    private _config: IConfig;
    private _client: GraphQLClient;

    /**
     * Constructor
     * Create an instace of TibberQuery class
     * @param config Config object
     */
    constructor(config: IConfig) {
        this.active = false;
        this._config = config;
        this._client = new GraphQLClient(this._config.apiEndpoint.queryUrl, {
            headers: {
                authorization: 'Bearer ' + this._config.apiEndpoint.apiKey,
            },
        });
    }

    /**
     * General GQL query
     * @param query GQL query.
     * @param variables Variables used by query parameter.
     * @return Query result as JSON data
     */
    public async query(query: string, variables?: object): Promise<any> {
        try {
            return await this._client.request(query, variables);
        } catch (error) {
            return { error };
        }
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
                home && home.currentSubscription && home.currentSubscription.priceInfo ? home.currentSubscription.priceInfo.current : {},
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
                data && data.currentSubscription && data.currentSubscription.priceInfo ? data.currentSubscription.priceInfo.today : {},
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
                data && data.currentSubscription && data.currentSubscription.priceInfo ? data.currentSubscription.priceInfo.tomorrow : {},
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
            const home: IHome = result.viewer.home;
            return Object.assign([] as IConsumption[], home && home.consumption ? home.consumption.nodes : []);
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
}
