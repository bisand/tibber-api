export interface ILiveMeasurement {
    timestamp: string;
    power: number;
    lastMeterConsumption: number;
    accumulatedConsumption: number;
    accumulatedProduction: number;
    accumulatedConsumptionLastHour: number;
    accumulatedProductionLastHour: number;
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
    currentL1: number;
    currentL2: number;
    currentL3: number;
    signalStrength: number;
}
