export interface IHomeConsumptionPageInfo {
    endCursor: string;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    count: number;
    currency: string;
    totalCost: number;
    totalConsumption: number;
    filtered: number;
}
