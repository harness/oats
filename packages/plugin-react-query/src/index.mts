import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from '@harnessio/oats-cli/plugin';

import type { Config } from './config.mjs';
import { generateReactQueryHooks } from './generateReactQueryHooks.mjs';

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url));

export default function reactQueryPlugin(config?: Config): Plugin {
	return {
		name: 'oa2ts-plugin-react-query',
		generate: generateReactQueryHooks(config),
		templatesPath: path.resolve(DIR_NAME, 'templates'),
	};
}
