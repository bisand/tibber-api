import { createHash, randomBytes } from 'crypto';
import { IOAuthConfig } from '../models/data/IOAuthConfig';
import { ITokenSet } from '../models/data/ITokenSet';
import { DataScope } from '../models/enums/DataScope';
import { HeaderManager } from '../tools/HeaderManager';
import { httpRequestAsync, jsonTryParse } from '../tools/HttpClient';
import { TibberDataError } from './models/TibberDataError';

export class TibberOAuth {
    public static readonly DEFAULT_AUTHORIZE_URL = 'https://thewall.tibber.com/connect/authorize';
    public static readonly DEFAULT_TOKEN_URL = 'https://thewall.tibber.com/connect/token';
    public static readonly DEFAULT_SCOPES: string[] = [
        DataScope.OPENID,
        DataScope.PROFILE,
        DataScope.EMAIL,
        DataScope.OFFLINE_ACCESS,
        DataScope.USER_READ,
        DataScope.HOMES_READ,
    ];

    private _config: IOAuthConfig;
    private _headerManager: HeaderManager;

    /**
     * Constructor
     * Create an instance of TibberOAuth, used to get access tokens for the Tibber Data API.
     * @param {IOAuthConfig} config OAuth client created at https://data-api.tibber.com/clients/manage/
     * @see IOAuthConfig
     */
    constructor(config: IOAuthConfig) {
        if (!config || !config.clientId || !config.redirectUri) {
            throw new Error('Missing mandatory parameters [clientId, redirectUri]');
        }
        this._config = config;
        this._headerManager = new HeaderManager({ active: false, apiEndpoint: { apiKey: '', queryUrl: '', userAgent: config.userAgent } });
    }

    /**
     * Create the URL the user must open to log in and give consent.
     * Tibber then redirects to the redirect URI with the query parameters code and state.
     * @param options state: value returned unchanged in the redirect, random by default. pkce: use PKCE, true by default.
     * @return The URL, the state to compare with the one in the redirect, and the code verifier to pass to exchangeCode.
     */
    public createAuthorizationUrl(options: { state?: string; pkce?: boolean } = {}): { url: string; state: string; codeVerifier?: string } {
        const state = options.state ?? randomBytes(16).toString('base64url');
        const url = new URL(this._config.authorizeUrl ?? TibberOAuth.DEFAULT_AUTHORIZE_URL);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('client_id', this._config.clientId);
        url.searchParams.set('redirect_uri', this._config.redirectUri);
        url.searchParams.set('scope', (this._config.scopes ?? TibberOAuth.DEFAULT_SCOPES).join(' '));
        url.searchParams.set('state', state);

        let codeVerifier: string | undefined;
        if (options.pkce ?? true) {
            codeVerifier = randomBytes(48).toString('base64url');
            url.searchParams.set('code_challenge', createHash('sha256').update(codeVerifier).digest('base64url'));
            url.searchParams.set('code_challenge_method', 'S256');
        }
        return { url: url.href, state, codeVerifier };
    }

    /**
     * Exchange the code from the redirect for tokens.
     * @param code The code query parameter from the redirect
     * @param codeVerifier The code verifier from createAuthorizationUrl, if PKCE was used
     * @return ITokenSet object
     */
    public async exchangeCode(code: string, codeVerifier?: string): Promise<ITokenSet> {
        const params: Record<string, string> = { grant_type: 'authorization_code', code, redirect_uri: this._config.redirectUri };
        if (codeVerifier) {
            params.code_verifier = codeVerifier;
        }
        return this.requestTokens(params);
    }

    /**
     * Get a new access token.
     * @param refreshToken The refresh token from a previous ITokenSet
     * @return ITokenSet object. Store it, the old refresh token may no longer work.
     */
    public async refresh(refreshToken: string): Promise<ITokenSet> {
        const tokens = await this.requestTokens({ grant_type: 'refresh_token', refresh_token: refreshToken });
        return { ...tokens, refreshToken: tokens.refreshToken ?? refreshToken };
    }

    private async requestTokens(params: Record<string, string>): Promise<ITokenSet> {
        const form = new URLSearchParams({ ...params, client_id: this._config.clientId });
        if (this._config.clientSecret) {
            form.set('client_secret', this._config.clientSecret);
        }
        const response = await httpRequestAsync({
            method: 'POST',
            url: this._config.tokenUrl ?? TibberOAuth.DEFAULT_TOKEN_URL,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': this._headerManager.userAgent,
            },
            body: form.toString(),
            timeout: this._config.requestTimeout ?? 30000,
        });
        const body = jsonTryParse(response.body);
        if (response.status < 200 || response.status >= 300 || !body?.access_token) {
            const reason = body?.error_description ?? body?.error ?? `HTTP ${response.status}`;
            throw new TibberDataError(`Token request failed: ${reason}`, response.status, body ?? response.body);
        }
        return {
            accessToken: body.access_token,
            refreshToken: body.refresh_token,
            expiresAt: body.expires_in ? Date.now() + Number(body.expires_in) * 1000 : undefined,
            tokenType: body.token_type,
            scope: body.scope,
            idToken: body.id_token,
        };
    }
}
