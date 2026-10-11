import { DeviceHistoryResolution } from '../enums/DeviceHistoryResolution';

export interface IDataDeviceHistoryOptions {
    resolution: DeviceHistoryResolution;
    /** Return data from this point and page forwards with next. Can not be combined with until. */
    since?: string | Date;
    /** Return data up to this point and page backwards with prev. Can not be combined with since. */
    until?: string | Date;
}

export interface IDataDeviceHistoryItem {
    time: string;
    data: Record<string, unknown>;
}

export interface IDataDeviceHistory {
    /** The time window that was actually used, which may differ from the one requested. */
    query: {
        resolution: DeviceHistoryResolution;
        effectiveStart: string;
        effectiveEnd: string;
        pageSize: number;
    };
    items: IDataDeviceHistoryItem[];
    /** Link to the previous page. Pass it to getDeviceHistoryPage. */
    prev?: string;
    /** Link to the next page. Pass it to getDeviceHistoryPage. */
    next?: string;
}
