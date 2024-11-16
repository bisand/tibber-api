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

	describe('Sanitized invalid User-Agent', () => {
		it('should sanitize and return the user agent with default user agent appended', () => {
			config.apiEndpoint.userAgent = 'Invalid@UserAgent!function now() { [native code] }';
			const headerManager = new HeaderManager(config);
			expect(headerManager.userAgent).toBe(`Invalid@UserAgent!function now()  native code ${defaultUserAgent}`);
		});
	});
});