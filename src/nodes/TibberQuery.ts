import { IConfig } from '../models/IConfig';
import { GraphQLClient } from 'graphql-request';
import { IHome } from '../models/IHome';
import { gqlHomes, gqlHomesComplete } from '../gql/homes.gql';
import { IPriceInfo, IPrice } from '../models/IPriceInfo';
import { gqlCurrentEnergyPrice } from '../gql/energy.gql';
import { EnergyResolution } from '../models/EnergyResolution';
import { gqlConsumption } from '../gql/consumption.gql';

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

    public async query(query: string, variables?: object) {
        try {
            return await this._client.request(query, variables);
        } catch (error) {
            return { error };
        }
    }

    public async getHomes(): Promise<IHome[]> {
        const result = await this.query(gqlHomes);
        return Object.assign([] as IHome[], result.viewer.homes);
    }

    public async getHomesComplete(): Promise<IHome[]> {
        const result = await this.query(gqlHomesComplete);
        return Object.assign([] as IHome[], result.viewer.homes);
    }

    public async getCurrentEnergyPrice(homeId: string): Promise<IPrice> {
        const result = await this.query(gqlCurrentEnergyPrice);
        const data: IHome = result.viewer.homes.filter((element: IHome) => element.id === homeId)[0];
        return Object.assign(
            {} as IPrice,
            data && data.currentSubscription && data.currentSubscription.priceInfo ? data.currentSubscription.priceInfo.current : {},
        );
    }

    public async getCurrentEnergyPrices(): Promise<IHome[]> {
        const result = await this.query(gqlCurrentEnergyPrice);
        return Object.assign([] as IHome[], result.viewer.homes);
    }

    public async getConsumption(homeId: string, resolution: EnergyResolution, lastCount: number): Promise<IHome> {
        const variables = {resolution, lastCount};
        const result = await this.query(gqlConsumption, variables);
        const data: IHome = result.viewer.homes.filter((element: IHome) => element.id === homeId)[0];
        return Object.assign(
            {} as IHome,
            data && data.currentSubscription && data.currentSubscription.priceInfo ? data.currentSubscription.priceInfo.current : {},
        );
    }
}
