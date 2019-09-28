import { IAddress } from "./IAddress";
import { IMeteringPointData } from "./IMeteringPointData";
import { IFeatures } from "./IFeatures";
import { ILegalEntity } from "./ILegalEntity";
import { ISubscription } from "./ISubscription";
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
    meteringPointData: IMeteringPointData;
    currentSubscription: ISubscription;
    subscriptions: ISubscription[];
    features: IFeatures;
}
