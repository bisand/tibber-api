
export enum PriceRatingLevel {
    /** The price is within the range of what is considered being normal (market dependent; see ‘priceRating.thresholdPercentages’ for limits) */
    NORMAL = 'NORMAL',
    /** The price is within the range of what is considered being low (market dependent; see ‘priceRating.thresholdPercentages’ for limits) */
    LOW = 'LOW',
    /** The price is within the range of what is considered being high (market dependent; see ‘priceRating.thresholdPercentages’ for limits) */
    HIGH = 'HIGH'
}
