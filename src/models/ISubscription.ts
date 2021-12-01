import { IPriceInfo } from './IPriceInfo';
import { ILegalEntity } from './ILegalEntity';
import { IPriceRating } from './IPriceRating';
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
    /** 
     * Price information related to the subscription
     * @deprecated
     * @see priceRating should be used instead 
     */
    priceInfo: IPriceInfo;
    /** Price information related to the subscription */
    priceRating: IPriceRating;
}
