export interface IQueryPayload {
    token: string;
    operationName: string | null;
    query: string;
    variables: Record<string, unknown> | null;
    extensions: Record<string, unknown> | null;
}
