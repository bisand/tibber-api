import { IQueryPayload } from "./IQueryPayload";

export interface IQuery {
    id: string;
    type: string;
    payload?: IQueryPayload;
}
