import { IConfig } from '../models/IConfig';

export interface ITibberQuery {
    get config(): IConfig;
    set config(value: IConfig);
    getWebsocketSubscriptionUrl(): Promise<URL>;
}
