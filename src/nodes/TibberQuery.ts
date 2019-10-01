import { IConfig } from '../models/IConfig';
import { GraphQLClient } from 'graphql-request';
import { IHome } from "../models/IHome";
import { gqlHomes, gqlHomesComplete as gqlHomesComplete } from '../gql/homes.gql';

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

    public async query(query: string) {
        try {
            return await this._client.request(query);
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
}
