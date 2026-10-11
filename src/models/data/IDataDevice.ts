import { DeviceHistoryResolution } from '../enums/DeviceHistoryResolution';

export interface IDataDeviceInfo {
    name: string;
    brand: string;
    model?: string;
}

export interface IDataDeviceHistoryInfo {
    /** Resolutions available for device history. Empty if the device has no history. */
    resolutions: DeviceHistoryResolution[];
    maxRetentionDays?: number;
}

export interface IDataDeviceItem {
    id: string;
    /** Often the id used by the vendor */
    externalId: string;
    info: IDataDeviceInfo;
    supportedHistory: IDataDeviceHistoryInfo;
}

/**
 * Seldom changing property of a device. Which fields are present depends on the kind of attribute.
 * New attributes can appear at any time.
 */
export interface IDataDeviceAttribute {
    id: string;
    description?: string;
    value?: string | boolean;
    availableValues?: string[];
    status?: string;
    ssid?: string;
    bssid?: string;
    ipAddress?: string;
    [key: string]: unknown;
}

/**
 * Current state value of a device. New capabilities can appear at any time.
 */
export interface IDataDeviceCapability {
    id: string;
    description: string;
    value: number | string;
    unit?: string;
    availableValues?: string[];
    [key: string]: unknown;
}

export interface IDataDevice extends IDataDeviceItem {
    status: { lastSeen?: string };
    attributes: IDataDeviceAttribute[];
    capabilities: IDataDeviceCapability[];
}
