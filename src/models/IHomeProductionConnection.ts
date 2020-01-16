import { IProduction } from "./IProduction";
import { IHomeProductionEdge } from "./IHomeProductionEdge";
import { IHomeProductionPageInfo } from "./IHomeProductionPageInfo";
export interface IHomeProductionConnection {
    pageInfo: IHomeProductionPageInfo;
    nodes: IProduction[];
    edges: IHomeProductionEdge[];
}
