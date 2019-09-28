import { ILevel } from "./ILevel";
export interface IPriceInfo {
    total: number;
    energy: number;
    tax: number;
    startsAt: string;
    level?: ILevel;
}
