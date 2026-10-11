export interface IConsumption {
    homeId?: string;
    from: string;
    to: string;
    unitPrice: number;
    unitPriceVAT: number;
    consumption: number;
    consumptionUnit: string;
    /** @deprecated use cost instead */
    totalCost: number;
    /** @deprecated use cost instead */
    unitCost: number;
    cost: number;
    currency: string;
}
