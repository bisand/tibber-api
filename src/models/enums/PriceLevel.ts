export enum PriceLevel {
    /** The price is greater than 90 % and smaller than 115 % compared to average price. */
    NORMAL = 'NORMAL',
    /** The price is greater than 60 % and smaller or equal to 90 % compared to average price. */
    CHEAP = 'CHEAP',
    /** The price is smaller or equal to 60 % compared to average price. */
    VERY_CHEAP = 'VERY_CHEAP',
    /** The price is greater or equal to 115 % and smaller than 140 % compared to average price. */
    EXPENSIVE = 'EXPENSIVE',
    /** The price is greater or equal to 140 % compared to average price. */
    VERY_EXPENSIVE = 'VERY_EXPENSIVE',
}
