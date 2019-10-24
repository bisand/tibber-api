import { IPriceInfo } from './IPriceInfo';
import { ILegalEntity } from './ILegalEntity';
export interface ISubscription {
    id: string;
    subscriber: ILegalEntity;
    validFrom: string;
    validTo: null;
    status: string;
    priceInfo: IPriceInfo;
}
