export interface IConsumption {
    homeId?: string;
    from: string;
    to: string;
    unitPrice: number;
    unitPriceVAT: number;
    consumption: number;
    consumptionUnit: string;
    cost: number;
    currency: string;
}
