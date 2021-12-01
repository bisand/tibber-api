import { PriceRatingThresholdPercentages } from './PriceRatingThresholdPercentages';
import { PriceRatingType } from './PriceRatingType';

export interface IPriceRating {
    /** The different ‘high’/‘low’ price breakpoints (market dependent) */
    thresholdPercentages: PriceRatingThresholdPercentages;
    /** The hourly prices of today, the previous 7 days, and tomorrow */
    hourly: PriceRatingType;
    /** The daily prices of today and the previous 30 days */
    daily: PriceRatingType;
    /** The monthly prices of this month and the previous 31 months */
    monthly: PriceRatingType;
}
