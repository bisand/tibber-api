import { HeaderManager } from '../../src/tools/HeaderManager';
import { IConfig } from '../../src/models/IConfig';
import { version } from '../../Version';

// FILE: src/nodes/HeaderManager.test.ts


describe('HeaderManager', () => {
    const defaultUserAgent = `bisand/tibber-api/${version}`;
    const userAgentMaxLength = 255 - defaultUserAgent.length;

    let config: IConfig;

    beforeEach(() => {
        config = {
            apiEndpoint: {
                userAgent: ''
            }
        } as IConfig;
    });

    describe('Valid User-Agent', () => {
        it('should return the sanitized user agent with default user agent appended', () => {
            config.apiEndpoint.userAgent = 'ValidUserAgent';
            const headerManager = new HeaderManager(config);
            expect(headerManager.userAgent).toBe(`ValidUserAgent ${defaultUserAgent}`);
        });
    });
});