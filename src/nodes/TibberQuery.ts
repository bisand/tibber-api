import { IConfig } from '../models/config';
import { GraphQLClient } from 'graphql-request';
import { IHome } from '../models/interfaces';
import { homesGql } from '../gql/homes.gql';

export class TibberQuery {
    public active: boolean = false;
    private _config!: IConfig;
    private _client: any;
    constructor(config: IConfig) {
        this._config = config;
        this.active = false;
        this._client = new GraphQLClient(String(this._config.apiEndpoint.queryUrl), {
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

    public async getHomes() {
        const result = await this.query(homesGql);
        return this.getObjectFromJSON<IHome>(result);
    }

    private getObjectFromJSON = <T>(json: string) : T => {
        return JSON.parse(json);
    }

}