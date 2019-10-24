import { ILevel } from './ILevel';
export interface IPriceInfo {
    current?: IPrice;
    today?: IPrice;
    tomorrow?: IPrice;
    range?: any; // Should be SubscriptionPriceConnection
}

export interface IPrice {
    homeId?: string;
    total: number;
    energy: number;
    tax: number;
    startsAt: string;
    level: ILevel;
}
