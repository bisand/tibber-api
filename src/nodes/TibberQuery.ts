import { Config } from "../models/config";
import { GraphQLClient } from "graphql-request";

// const { GraphQLClient } = require('graphql-request');

export class TibberQuery {
    _config!: Config;
    active: boolean = false;
    client: any;
    constructor(config: Config) {
        var node = this;
        node._config = config;
        node.active = false;
        node.client = new GraphQLClient(config.apiEndpoint.queryUrl, {
            headers: {
                authorization: 'Bearer ' + config.apiEndpoint.apiKey,
            },
        });
    }

    async query(query: any) {
        try {
            return await this.client.request(query);
        } catch (error) {
            return { error: error };
        }
    }
}

module.exports = TibberQuery;
