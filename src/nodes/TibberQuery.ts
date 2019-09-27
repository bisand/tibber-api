import { IConfig } from '../models/config';
import { GraphQLClient } from 'graphql-request';

// const { GraphQLClient } = require('graphql-request');

export class TibberQuery {
    public active: boolean = false;
    private _config!: IConfig;
    private client: any;
    constructor(config: IConfig) {
        const node = this;
        node._config = config;
        node.active = false;
        node.client = new GraphQLClient(config.apiEndpoint.queryUrl, {
            headers: {
                authorization: 'Bearer ' + config.apiEndpoint.apiKey,
            },
        });
    }

    public async query(query: any) {
        try {
            return await this.client.request(query);
        } catch (error) {
            return { error: error };
        }
    }
}

module.exports = TibberQuery;
