export interface ISubscriptionPriceConnectionPageInfo {
    endCursor: string;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    resolution: string;
    currency: string;
    count: number;
    precision: string;
    minEnergy: number;
    minTotal: number;
    maxEnergy: number;
    maxTotal: number;
}
