import { ITokenSet } from './ITokenSet';
import { TibberOAuth } from '../../nodes/TibberOAuth';

export interface IDataConfig {
    /** A valid access token. Use this if you handle the OAuth flow and token refresh yourself. */
    accessToken?: string;
    /** Tokens from TibberOAuth. Together with oauth, the access token is refreshed automatically. */
    tokens?: ITokenSet;
    /** Used to refresh the access token when it expires. */
    oauth?: TibberOAuth;
    /** Called with the new tokens after a refresh. Store them, the old refresh token may no longer work. */
    onTokensRefreshed?: (tokens: ITokenSet) => void | Promise<void>;
    /** User agent string. Handled the same way as IEndpoint.userAgent. */
    userAgent?: string;
    apiUrl?: string;
    /** Request timeout in milliseconds. */
    requestTimeout?: number;
    /** Number of retries on 429 and 5xx responses. */
    maxRetries?: number;
}
