import { PriceRatingLevel } from "./enums/PriceRatingLevel";


export interface PriceRatingEntry {
    /** The start time of the price */
    time: string;
    /** Nordpool spot price */
    energy: number;
    /** The total price (incl. tax) */
    total: number;
    /** The tax part of the price (guarantee of origin certificate, energy tax (Sweden only) and VAT) */
    tax: number;
    /** The percentage difference compared to the trailing price average (1 day for ‘hourly’, 30 days for ‘daily’ and 32 months for ‘monthly’) */
    difference: number;
    /** The price level compared to recent price values (calculated using ‘difference’ and ‘priceRating.thresholdPercentages’) */
    level: PriceRatingLevel;
}
