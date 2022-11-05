import type { IPlugin } from '@harnessio/oats-cli';

import type { Config } from './config.mjs';
import { generateReactQueryHooks } from './generateReactQueryHooks.mjs';

export default function reactQueryPlugin(config?: Config): IPlugin {
	return {
		name: 'oa2ts-plugin-react-query',
		generate: generateReactQueryHooks(config),
	};
}
