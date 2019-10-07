import { IConfig } from '../models/IConfig';
import { GraphQLClient } from 'graphql-request';
import { IHome } from '../models/IHome';
import { IPrice } from '../models/IPriceInfo';
import { EnergyResolution } from '../models/EnergyResolution';
import { IConsumption } from '../models/IConsumption';
import { gqlConsumption } from '../gql/consumption.gql';
import { gqlHomes, gqlHomesComplete } from '../gql/homes.gql';
import { gqlHome, gqlHomeComplete } from '../gql/home.gql';
import { gqlCurrentEnergyPrice, gqlTodaysEnergyPrices, gqlTomorrowsEnergyPrices } from '../gql/energy.gql';

export class TibberQuery {
    public active: boolean;
    private _config: IConfig;
    private _client: GraphQLClient;
    constructor(config: IConfig) {
        this.active = false;
        this._config = config;
        this._client = new GraphQLClient(this._config.apiEndpoint.queryUrl, {
            headers: {
                authorization: 'Bearer ' + this._config.apiEndpoint.apiKey,
            },
        });
    }

    public async query(query: string, variables?: object): Promise<any> {
        try {
            return await this._client.request(query, variables);
        } catch (error) {
            return { error };
        }
    }

    public async getHome(homeId: string): Promise<IHome[]> {
        const variables = { homeId };
        const result = await this.query(gqlHome, variables);
        if (result && result.viewer && result.viewer.home) {
            return Object.assign({} as IHome, result.viewer.home);
        }
        return result && result.error ? result : {};
    }

    public async getHomeComplete(homeId: string): Promise<IHome[]> {
        const variables = { homeId };
        const result = await this.query(gqlHomeComplete, variables);
        if (result && result.viewer && result.viewer.home) {
            return Object.assign({} as IHome, result.viewer.home);
        }
        return result && result.error ? result : {};
    }

    public async getHomes(): Promise<IHome[]> {
        const result = await this.query(gqlHomes);
        if (result && result.viewer && Array.isArray(result.viewer.homes)) {
            return Object.assign([] as IHome[], result.viewer.homes);
        }
        return result && result.error ? result : {};
    }

    public async getHomesComplete(): Promise<IHome[]> {
        const result = await this.query(gqlHomesComplete);
        if (result && result.viewer && Array.isArray(result.viewer.homes)) {
            return Object.assign([] as IHome[], result.viewer.homes);
        }
        return result && result.error ? result : {};
    }

    public async getCurrentEnergyPrice(homeId: string): Promise<IPrice> {
        const variables = { homeId };
        const result = await this.query(gqlCurrentEnergyPrice, variables);
        if (result && result.viewer && result.viewer.home) {
            const data: IHome = result.viewer.home;
            return Object.assign(
                {} as IPrice,
                data && data.currentSubscription && data.currentSubscription.priceInfo ? data.currentSubscription.priceInfo.current : {},
            );
        }
        return result && result.error ? result : {};
    }

    public async getCurrentEnergyPrices(): Promise<IHome[]> {
        const result = await this.query(gqlCurrentEnergyPrice);
        if (result && result.viewer && Array.isArray(result.viewer.homes)) {
            return Object.assign([] as IHome[], result.viewer.homes);
        }
        return result && result.error ? result : {};
    }

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

    public async getConsumption(resolution: EnergyResolution, lastCount: number, homeId?: string): Promise<IConsumption[]> {
        const variables = { resolution, lastCount };
        const result = await this.query(gqlConsumption, variables);
        if (result && result.viewer && Array.isArray(result.viewer.homes)) {
            if (!homeId) {
                const consumptions = result.viewer.homes.map((item: IHome) => {
                    const nodes = item.consumption.nodes.map((node: IConsumption) => {
                        node.homeId = item.id;
                        return node;
                    });
                    return nodes;
                });
                return Object.assign([] as IConsumption[], consumptions);
            }
            const home: IHome = result.viewer.homes.filter((element: IHome) => element.id === homeId)[0];
            return Object.assign([] as IConsumption[], home && home.consumption ? home.consumption.nodes : []);
        }
        return result && result.error ? result : {};
    }
}
