export interface ApiEndpoint {
    feedUrl: string;
    queryUrl: string;
    apiKey: string;
}

export interface Config {
    active: boolean;
    // Endpoint configuration.
    apiEndpoint: ApiEndpoint;
    // Query configuration.
    homeId: string;
    timestamp: boolean;
    power: boolean;
    lastMeterConsumption: boolean;
    accumulatedConsumption: boolean;
    accumulatedProduction: boolean;
    accumulatedCost: boolean;
    accumulatedReward: boolean;
    currency: boolean;
    minPower: boolean;
    averagePower: boolean;
    maxPower: boolean;
    powerProduction: boolean;
    minPowerProduction: boolean;
    maxPowerProduction: boolean;
    lastMeterProduction: boolean;
    powerFactor: boolean;
    voltagePhase1: boolean;
    voltagePhase2: boolean;
    voltagePhase3: boolean;
    currentPhase1: boolean;
    currentPhase2: boolean;
    currentPhase3: boolean;
}
