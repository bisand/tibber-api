import { IPrice } from './IPrice';
import { ISubscriptionPriceEdge } from "./ISubscriptionPriceEdge";
import { ISubscriptionPriceConnectionPageInfo } from "./ISubscriptionPriceConnectionPageInfo";
export interface ISubscriptionPriceConnection {
    pageInfo: ISubscriptionPriceConnectionPageInfo;
    edges: ISubscriptionPriceEdge[];
    nodes: IPrice[];
}
