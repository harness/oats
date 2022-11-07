import type { IPlugin } from '@harnessio/oats-cli';

import type { IConfig, IOverrideOptions } from './config.mjs';
import { generateReactQueryHooks } from './generateReactQueryHooks.mjs';

export default function reactQueryPlugin(config?: IConfig): IPlugin {
	return {
		name: 'oa2ts-plugin-react-query',
		generate: generateReactQueryHooks(config),
	};
}

export type { IConfig, IOverrideOptions };
