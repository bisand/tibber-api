export interface IConsumption {
    homeId?: string;
    from: string;
    to: string;
    unitPrice: number;
    unitPriceVAT: number;
    consumption: number;
    consumptionUnit: string;
    totalCost: number;
    unitCost: number;
    cost: number;
    currency: string;
}
