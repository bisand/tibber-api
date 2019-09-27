import { IConfig } from '../models/config';
import { GraphQLClient } from 'graphql-request';

// const { GraphQLClient } = require('graphql-request');

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

    public async query(query: any) {
        try {
            return await this._client.request(query);
        } catch (error) {
            return { error: error };
        }
    }
}
