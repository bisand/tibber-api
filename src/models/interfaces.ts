export enum ILevel {
    Cheap = 'CHEAP',
    Expensive = 'EXPENSIVE',
    High = 'HIGH',
    Normal = 'NORMAL',
    VeryCheap = 'VERY_CHEAP',
    VeryExpensive = 'VERY_EXPENSIVE',
}

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
    currentPhase1: number;
    currentPhase2: number;
    currentPhase3: number;
}

export interface IAddress {
    address1: string;
    address2: string;
    address3: string;
    postalCode: string;
    city: string;
    country: string;
    latitude: string;
    longitude: string;
}

export interface ICurrentSubscription {
    id: string;
    validFrom: string;
    validTo: null;
    status: string;
    priceInfo: IPriceInfo;
}

export interface IPriceInfo {
    total: number;
    energy: number;
    tax: number;
    startsAt: string;
    level?: ILevel;
}

interface IConsumption {
    from?: string;
    to?: string;
    unitPrice: number;
    unitPriceVAT: number;
    consumption: number;
    consumptionUnit: string;
    cost: number;
    currency: string;
}

export interface IContactInfo {
    email: string;
    mobile: string;
}

export interface IHome {
    id: string;
    timeZone: string;
    appNickname: string;
    appAvatar: string;
    size: number;
    type: string;
    numberOfResidents: number;
    primaryHeatingSource: string;
    hasVentilationSystem: boolean;
    mainFuseSize: number;
    owner: ILegalEntity;
    address: IAddress;
}

export interface ILegalEntity {
    id: string;
    firstName: string;
    isCompany: boolean;
    name: string;
    middleName: string;
    lastName: string;
    organizationNo: string;
    language: string;
    contactInfo: IContactInfo;
    address: IAddress;
}
