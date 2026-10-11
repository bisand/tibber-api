import { IPrice } from './IPrice';
import { ISubscriptionPriceConnection } from './ISubscriptionPriceConnection';
export interface IPriceInfo {
    current?: IPrice;
    today?: IPrice[];
    tomorrow?: IPrice[];
    /** @deprecated use priceInfoRange on the subscription instead */
    range?: ISubscriptionPriceConnection;
}
