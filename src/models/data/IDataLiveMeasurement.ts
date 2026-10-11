/**
 * Device that can stream live measurements.
 */
export interface IDataLiveEventDevice {
    /** ID to pass to TibberDataFeed. It is not the same as the device ID from getDevices. */
    id: string;
    /** Kind of device, for example "tibber pulse" */
    type?: string;
    [key: string]: unknown;
}

/**
 * Live measurement from a meter. All values can be missing, depending on hardware and firmware.
 * New values can appear at any time.
 */
export interface IDataLiveMeasurement {
    deviceId: string;
    timestamp?: string;
    power?: number;
    powerProduction?: number;
    minPower?: number;
    minPowerTimestamp?: string;
    averagePower?: number;
    maxPower?: number;
    maxPowerTimestamp?: string;
    minPowerProduction?: number;
    maxPowerProduction?: number;
    accumulatedConsumption?: number;
    accumulatedProduction?: number;
    accumulatedConsumptionLastHour?: number;
    accumulatedProductionLastHour?: number;
    estimatedAccumulatedConsumptionCurrentHour?: number;
    effectiveHourlyConsumptionLimit?: number;
    accumulatedCost?: number;
    accumulatedReward?: number;
    currency?: string;
    lastMeterConsumption?: number;
    lastMeterProduction?: number;
    voltageL1?: number;
    voltageL2?: number;
    voltageL3?: number;
    currentL1?: number;
    currentL2?: number;
    currentL3?: number;
    powerFactor?: number;
    signalStrength?: number;
    [key: string]: unknown;
}

export interface IDataStreamError {
    /** upstream_unavailable, device_not_streamable or evicted */
    code: string;
    /** True if the stream can be opened again */
    transient: boolean;
    /** Seconds to wait before opening the stream again */
    retryAfter?: number;
    deviceId?: string;
}
