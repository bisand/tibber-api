export interface IQueryPayload {
    extensions: any;
    operationName: string | undefined | null;
    query: string;
    token: string;
    variables: any;
}
