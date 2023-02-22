import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Liquid } from 'liquidjs';

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url));

export const liquid = new Liquid();

liquid.registerFilter('path_to_template', pathToTemplate);
liquid.registerFilter('property_accessor', propertyAccessor);

const VAR_NAME_REGEX = /^[a-zA-Z_$][a-zA-Z0-9$_]*$/g;

// internal function
export function _readTemplate(name: string): string {
	return fs.readFileSync(path.resolve(DIR_NAME, `./templates/${name}`), 'utf8');
}

export function pathToTemplate(tpl: string): string {
	return tpl.replace(/\{([\w\W]+?)\}/g, (_, p1) => {
		return '${props' + propertyAccessor(p1) + '}';
	});
}

export function propertyAccessor(name: string): string {
	return name.match(VAR_NAME_REGEX) ? `.${name}` : `['${name}']`;
}
