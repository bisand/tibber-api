export class TibberDataError extends Error {
    /** HTTP status code */
    public status: number;
    /** Parsed response body, if any. The Data API returns problem details, the token endpoint an OAuth error. */
    public body?: any;
    public retryAfter?: string;

    constructor(message: string, status: number, body?: any, retryAfter?: string) {
        super(message);
        this.name = 'TibberDataError';
        this.status = status;
        this.body = body;
        this.retryAfter = retryAfter;
    }
}
