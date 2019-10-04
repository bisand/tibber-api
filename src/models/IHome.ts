import { IAddress } from './IAddress';
import { IMeteringPointData } from './IMeteringPointData';
import { IFeatures } from './IFeatures';
import { ILegalEntity } from './ILegalEntity';
import { ISubscription } from './ISubscription';
import { IConsumption } from './IConsumption';
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
    mainFuseSize: null;
    address: IAddress;
    owner: ILegalEntity;
    consumption: IHomeConsumptionConnection;
    meteringPointData: IMeteringPointData;
    currentSubscription: ISubscription;
    subscriptions: ISubscription[];
    features: IFeatures;
}

export interface IHomeConsumptionConnection {
    pageInfo: IHomeConsumptionPageInfo;
    nodes: IConsumption[];
    edges: IHomeConsumptionEdge[];
}
export interface IHomeConsumptionPageInfo {
    endCursor: string;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    count: number;
    currency: string;
    totalCost: number;
    totalConsumption: number;
    filtered: number;
}

export interface IHomeConsumptionEdge {
    cursor: string;
    node: IConsumption;
}
