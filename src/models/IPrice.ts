import { PriceLevel } from './enums/PriceLevel';
export interface IPrice {
    homeId?: string;
    total?: number;
    energy?: number;
    tax?: number;
    startsAt?: string;
    currency?: string;
    level?: PriceLevel;
}
