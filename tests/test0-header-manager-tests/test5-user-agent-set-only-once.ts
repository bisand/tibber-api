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

	describe('User-Agent set only once', () => {
		it('it should only be alowed to set user-agent once', () => {
			config.apiEndpoint.userAgent = 'ValidUserAgent';
			const headerManager = new HeaderManager(config);
			config.apiEndpoint.userAgent = 'AnotherUserAgent';
			const headerManager2 = new HeaderManager(config);
			expect(headerManager.userAgent).toBe(`ValidUserAgent ${defaultUserAgent}`);
			expect(headerManager2.userAgent).toBe(`ValidUserAgent ${defaultUserAgent}`);
		});
	});
});