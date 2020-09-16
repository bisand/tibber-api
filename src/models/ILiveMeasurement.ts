export interface ILiveMeasurement {
    timestamp: string;
    power: number;
    lastMeterConsumption: number;
    accumulatedConsumption: number;
    accumulatedProduction: number;
    accumulatedCost: number;
    accumulatedReward: number;
    currency: string;
    minPower: number;
    averagePower: number;
    maxPower: number;
    powerProduction: number;
    minPowerProduction: number;
    maxPowerProduction: number;
    lastMeterProduction: number;
    powerFactor: number;
    voltagePhase1: number;
    voltagePhase2: number;
    voltagePhase3: number;
    currentPhase1: number; // Deprecated! Will be removed in the future.
    currentPhase2: number; // Deprecated! Will be removed in the future.
    currentPhase3: number; // Deprecated! Will be removed in the future.
    currentL1: number;
    currentL2: number;
    currentL3: number;
    signalStrength: number;
}
