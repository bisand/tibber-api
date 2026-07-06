import { HeatingSource } from './enums/HeatingSource';
import { HomeAvatar } from './enums/HomeAvatar';
import { HomeType } from './enums/HomeType';

export interface IUpdateHomeInput {
    homeId: string;
    appNickname?: string;
    appAvatar?: HomeAvatar;
    size?: number;
    type?: HomeType;
    numberOfResidents?: number;
    primaryHeatingSource?: HeatingSource;
    hasVentilationSystem?: boolean;
    mainFuseSize?: number;
}
