export interface IOAuthConfig {
    clientId: string;
    clientSecret?: string;
    /** Must match one of the redirect URIs registered on the client exactly. */
    redirectUri: string;
    /** Scopes to request. Defaults to the scopes needed to list homes. @see DataScope */
    scopes?: string[];
    /** User agent string. Handled the same way as IEndpoint.userAgent. */
    userAgent?: string;
    authorizeUrl?: string;
    tokenUrl?: string;
    /** Request timeout in milliseconds. */
    requestTimeout?: number;
}
