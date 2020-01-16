import { IConsumption } from './IConsumption';
import { IHomeConsumptionEdge } from "./IHomeConsumptionEdge";
import { IHomeConsumptionPageInfo } from "./IHomeConsumptionPageInfo";
export interface IHomeConsumptionConnection {
    pageInfo: IHomeConsumptionPageInfo;
    nodes: IConsumption[];
    edges: IHomeConsumptionEdge[];
}
