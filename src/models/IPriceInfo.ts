import { IPrice } from './IPrice';
export interface IPriceInfo {
    current?: IPrice;
    today?: IPrice;
    tomorrow?: IPrice;
    range?: any; // Should be SubscriptionPriceConnection
}


