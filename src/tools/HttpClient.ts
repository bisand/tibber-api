import { IncomingHttpHeaders, IncomingMessage, OutgoingHttpHeaders, request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { Readable } from 'stream';
import { constants, createGunzip } from 'zlib';
import { TimeoutError } from '../nodes/models/TimeoutError';

export interface IHttpResponse {
    status: number;
    headers: IncomingHttpHeaders;
    body: string;
}

export interface IHttpRequest {
    method: 'GET' | 'POST';
    url: string;
    headers: OutgoingHttpHeaders;
    body?: string;
    /** Socket idle timeout in milliseconds */
    timeout: number;
}

/**
 * Start a request and resolve when the response headers have arrived.
 * @returns The request and the response, with the response body decompressed if needed.
 */
export function openHttpStream(options: IHttpRequest) {
    const client = new URL(options.url).protocol === 'https:' ? httpsRequest : httpRequest;
    const req = client(options.url, { method: options.method, headers: { 'Accept-Encoding': 'gzip', ...options.headers } });
    const response = new Promise<{ res: IncomingMessage; stream: Readable }>((resolve, reject) => {
        req.on('response', (res) => {
            // Sync flush lets a compressed event stream be read while it is still open.
            const stream = res.headers['content-encoding'] === 'gzip'
                ? res.pipe(createGunzip({ flush: constants.Z_SYNC_FLUSH, finishFlush: constants.Z_SYNC_FLUSH }))
                : res;
            res.on('error', (err) => stream.destroy(err));
            resolve({ res, stream });
        });
        req.on('error', reject);
    });
    req.setTimeout(options.timeout, () => {
        req.destroy(new TimeoutError(`Request timeout for ${options.url}`));
    });
    req.end(options.body);
    return { req, response };
}

/**
 * Perform a request and read the whole response body.
 */
export async function httpRequestAsync(options: IHttpRequest): Promise<IHttpResponse> {
    const { res, stream } = await openHttpStream(options).response;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(chunk as Buffer);
    }
    return { status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks).toString('utf-8') };
}

/**
 * Parse a string as JSON. Returns undefined if it is not valid JSON.
 */
export function jsonTryParse(input: string): any {
    try {
        return JSON.parse(input);
    } catch (e) {
        return undefined;
    }
}
