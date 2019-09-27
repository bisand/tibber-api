export interface IApiEndpoint {
    feedUrl?: string | undefined;
    queryUrl?: string | undefined;
    apiKey?: string | undefined;
}

export interface IConfig {
    active?: boolean | undefined;
    // Endpoint configuration.
    apiEndpoint: IApiEndpoint;
    // Query configuration.
    homeId?: string | undefined;
    timestamp?: boolean | undefined;
    power?: boolean | undefined;
    lastMeterConsumption?: boolean | undefined;
    accumulatedConsumption?: boolean | undefined;
    accumulatedProduction?: boolean | undefined;
    accumulatedCost?: boolean | undefined;
    accumulatedReward?: boolean | undefined;
    currency?: boolean | undefined;
    minPower?: boolean | undefined;
    averagePower?: boolean | undefined;
    maxPower?: boolean | undefined;
    powerProduction?: boolean | undefined;
    minPowerProduction?: boolean | undefined;
    maxPowerProduction?: boolean | undefined;
    lastMeterProduction?: boolean | undefined;
    powerFactor?: boolean | undefined;
    voltagePhase1?: boolean | undefined;
    voltagePhase2?: boolean | undefined;
    voltagePhase3?: boolean | undefined;
    currentPhase1?: boolean | undefined;
    currentPhase2?: boolean | undefined;
    currentPhase3?: boolean | undefined;
}
