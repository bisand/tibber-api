import { HeaderManager } from '../../src/tools/HeaderManager';
import { IConfig } from '../../src/models/IConfig';
import { version } from '../../Version';

// FILE: src/nodes/HeaderManager.test.ts


describe('HeaderManager', () => {
    const defaultUserAgent = `bisand/tibber-api/${version}`;
    const userAgentMaxLength = 255 - defaultUserAgent.length - 1;

    let config: IConfig;

    beforeEach(() => {
        config = {
            apiEndpoint: {
                userAgent: ''
            }
        } as IConfig;
    });

    describe('sanitizeUserAgent', () => {
        it('should return the sanitized user agent', () => {
            const headerManager = new HeaderManager(config);
            expect(headerManager['sanitizeUserAgent']('ValidUserAgent')).toBe('ValidUserAgent');
        });

        it('should remove invalid characters from the user agent', () => {
            const headerManager = new HeaderManager(config);
            expect(headerManager['sanitizeUserAgent']('Invalid@UserAgent!function now() { [native code] }')).toBe('Invalid@UserAgent!function now()  native code');
        });

        it('should truncate the user agent if it exceeds the maximum length', () => {
            const longUserAgent = 'a'.repeat(userAgentMaxLength + 10);
            const headerManager = new HeaderManager(config);
            expect(headerManager['sanitizeUserAgent'](longUserAgent)).toBe(longUserAgent.substring(0, userAgentMaxLength));
        });

        it('should return an empty string if the user agent is undefined', () => {
            const headerManager = new HeaderManager(config);
            expect(headerManager['sanitizeUserAgent']()).toBe('');
        });
    });
});