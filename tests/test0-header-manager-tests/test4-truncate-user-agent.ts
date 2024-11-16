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

	describe('Truncate long User-Agent', () => {
		it('should truncate the user agent if it exceeds the maximum length', () => {
			const longUserAgent = 'a'.repeat(userAgentMaxLength + 10);
			config.apiEndpoint.userAgent = longUserAgent;
			const headerManager = new HeaderManager(config);
			expect(headerManager.userAgent.length).toBe(255);
		});
	});
});