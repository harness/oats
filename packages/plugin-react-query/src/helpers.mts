import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Liquid } from 'liquidjs';
import { pathToTemplate } from '@harnessio/oats-cli';

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url));

export const liquid = new Liquid();

liquid.registerFilter('path_to_template', pathToTemplate);

// internal function
export function _readTemplate(name: string): string {
	return fs.readFileSync(path.resolve(DIR_NAME, `./templates/${name}`), 'utf8');
}
