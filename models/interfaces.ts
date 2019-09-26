export enum Level {
    Cheap = "CHEAP",
    Expensive = "EXPENSIVE",
    High = "HIGH",
    Normal = "NORMAL",
    VeryCheap = "VERY_CHEAP",
    VeryExpensive = "VERY_EXPENSIVE",
}

export interface LiveMeasurement {
    timestamp:              string;
    power:                  number;
    lastMeterConsumption:   number;
    accumulatedConsumption: number;
    accumulatedProduction:  number;
    accumulatedCost:        number;
    accumulatedReward:      number;
    currency:               string;
    minPower:               number;
    averagePower:           number;
    maxPower:               number;
    powerProduction:        number;
    minPowerProduction:     number;
    maxPowerProduction:     number;
    lastMeterProduction:    number;
    powerFactor:            number;
    voltagePhase1:          number;
    voltagePhase2:          number;
    voltagePhase3:          number;
    currentPhase1:          number;
    currentPhase2:          number;
    currentPhase3:          number;
}

export interface Address {
    address1:   string;
    address2:   string;
    address3:   string;
    postalCode: string;
    city:       string;
    country:    string;
    latitude:   string;
    longitude:  string;
}

export interface CurrentSubscription {
    id:        string;
    validFrom: string;
    validTo:   null;
    status:    string;
    priceInfo: PriceInfo;
}

export interface PriceInfo {
    total:    number;
    energy:   number;
    tax:      number;
    startsAt: string;
    level?:   Level;
}

interface Consumption {
    from?: string;
    to?: string;
    unitPrice: number;
    unitPriceVAT: number;
    consumption: number;
    consumptionUnit: string;
    cost: number;
    currency: string;
}

export interface ContactInfo {
    email:  string;
    mobile: string;
}

export interface Home {
    id:                   string;
    timeZone:             string;
    appNickname:          string;
    appAvatar:            string;
    size:                 number;
    type:                 string;
    numberOfResidents:    number;
    primaryHeatingSource: string;
    hasVentilationSystem: boolean;
    mainFuseSize:         number;
    owner:                LegalEntity;
    address:              Address;
}

export interface LegalEntity {
    id:             string;
    firstName:      string;
    isCompany:      boolean;
    name:           string;
    middleName:     string;
    lastName:       string;
    organizationNo: string;
    language:       string;
    contactInfo:    ContactInfo;
    address:        Address;
}
