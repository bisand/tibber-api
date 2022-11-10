import { IQueryPayload } from "./IQueryPayload";

export interface IQuery {
    id?: string | undefined | null;
    type: string;
    payload?: IQueryPayload | string | Record<string, unknown> | undefined | null;
}
