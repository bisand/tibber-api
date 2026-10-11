import { IPriceInfo } from './IPriceInfo';
import { ILegalEntity } from './ILegalEntity';
import { IPriceRating } from './IPriceRating';
import { ISubscriptionPriceConnection } from './ISubscriptionPriceConnection';
export interface ISubscription {
    id: string;
    /** The owner of the subscription */
    subscriber: ILegalEntity;
    /** The time the subscription started */
    validFrom: string;
    /** The time the subscription ended */
    validTo: null;
    /** The current status of the subscription */
    status: string;
    /** Price information related to the subscription */
    priceInfo: IPriceInfo;
    /** Historical price information related to the subscription */
    priceInfoRange?: ISubscriptionPriceConnection;
    /**
     * Price ratings related to the subscription
     * @deprecated
     * @see priceInfo should be used instead
     */
    priceRating: IPriceRating;
}
