export interface ITokenSet {
    accessToken: string;
    /** Used to get a new access token. Tibber may replace it on every refresh, so always store the latest one. */
    refreshToken?: string;
    /** Time when the access token expires, in milliseconds since epoch. */
    expiresAt?: number;
    tokenType?: string;
    scope?: string;
    idToken?: string;
}
