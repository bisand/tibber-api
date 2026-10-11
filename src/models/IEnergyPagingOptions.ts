import { IPagingOptions } from './IPagingOptions';

export interface IEnergyPagingOptions extends IPagingOptions {
    /** Leave out empty records. The number of records left out is returned in pageInfo.filtered. */
    filterEmptyNodes?: boolean;
}
