import { IEndpoint } from './IEndpoint';

export interface IConfig {
    active: boolean;
    // Endpoint configuration.
    apiEndpoint: IEndpoint;
    // Query configuration.
    homeId?: string;
    timestamp?: boolean;
    power?: boolean;
    lastMeterConsumption?: boolean;
    accumulatedConsumption?: boolean;
    accumulatedProduction?: boolean;
    accumulatedProductionLastHour?: boolean;
    accumulatedConsumptionLastHour?: boolean;
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
    currentL1?: boolean;
    currentL2?: boolean;
    currentL3?: boolean;
    signalStrength?: boolean;

}
