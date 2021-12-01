import { PriceRatingEntry } from "./PriceRatingEntry";


export interface PriceRatingType {
    /** Lowest Nordpool spot price over the time period */
    minEnergy: number;
    /** Highest Nordpool spot price over the time period */
    maxEnergy: number;
    /** Lowest total price (incl. tax) over the time period */
    minTotal: number;
    /** Highest total price (incl. tax) over the time period */
    maxTotal: number;
    /** The price currency */
    currency: string;
    /** The individual price entries aggregated by hourly/daily/monthly values} */
    entries: PriceRatingEntry[];
}
