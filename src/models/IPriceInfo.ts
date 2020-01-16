import { IPrice } from './IPrice';
import { ISubscriptionPriceConnection } from './ISubscriptionPriceConnection';
export interface IPriceInfo {
    current?: IPrice;
    today?: IPrice[];
    tomorrow?: IPrice[];
    range?: ISubscriptionPriceConnection; // Should be SubscriptionPriceConnection
}
