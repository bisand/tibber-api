export interface IApiEndpoint {
    feedUrl: string;
    queryUrl: string;
    apiKey: string;
}

export interface IConfig {
    active: boolean;
    // Endpoint configuration.
    apiEndpoint: IApiEndpoint;
    // Query configuration.
    homeId?: string;
    timestamp?: boolean;
    power?: boolean;
    lastMeterConsumption?: boolean;
    accumulatedConsumption?: boolean;
    accumulatedProduction?: boolean;
    accumulatedCost?: boolean;
    accumulatedReward?: boolean;
    currency?: boolean;
    minPower?: boolean;
    averagePower?: boolean;
    maxPower?: boolean;
    powerProduction?: boolean;
    minPowerProduction?: boolean;
    maxPowerProduction?: boolean;
    lastMeterProduction?: boolean;
    powerFactor?: boolean;
    voltagePhase1?: boolean;
    voltagePhase2?: boolean;
    voltagePhase3?: boolean;
    currentPhase1?: boolean; // Deprecated! Will be removed in the future.
    currentPhase2?: boolean; // Deprecated! Will be removed in the future.
    currentPhase3?: boolean; // Deprecated! Will be removed in the future.
    currentL1?: boolean;
    currentL2?: boolean;
    currentL3?: boolean;
    signalStrength?: boolean;

}
