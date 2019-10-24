export interface IQueryPayload {
    extensions: any;
    operationName: string;
    query: string;
    token: string;
    variables: any;
}

export interface IQuery {
    id: string;
    type: string;
    payload?: IQueryPayload;
}
