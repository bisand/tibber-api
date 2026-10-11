export interface IPagingOptions {
    /** Return the first number of records. Can not be combined with last. */
    first?: number;
    /** Return the last number of records. Can not be combined with first. */
    last?: number;
    /** Return records before this point, not including it. Either a cursor from pageInfo or a Date. Can not be combined with after. */
    before?: string | Date;
    /** Return records from this point, including it. Either a cursor from pageInfo or a Date. Can not be combined with before. */
    after?: string | Date;
}
