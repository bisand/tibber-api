import { IPriceInfo } from './IPriceInfo';
export interface ICurrentSubscription {
    id: string;
    validFrom: string;
    validTo: null;
    status: string;
    priceInfo: IPriceInfo;
}
