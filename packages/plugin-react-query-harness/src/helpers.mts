import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Liquid } from 'liquidjs';
import type { OpenAPIV3 } from 'openapi-types';
import type { IObjectProps } from '@harnessio/oats-cli';
import { resolveValue, COMMENTS_TEMPLATE } from '@harnessio/oats-cli';

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url));

export const liquid = new Liquid();

liquid.registerFilter('path_to_template', pathToTemplate);
liquid.registerFilter('property_accessor', propertyAccessor);

const VAR_NAME_REGEX = /^[a-zA-Z_$][a-zA-Z0-9$_]*$/g;

// internal function
export function _readTemplate(name: string): string {
	return fs.readFileSync(path.resolve(DIR_NAME, `./templates/${name}`), 'utf8');
}

export function pathToTemplate(tpl: string, suffix = ''): string {
	return tpl.replace(/\{([\w\W]+?)\}/g, (_, p1) => {
		return '${props' + suffix + propertyAccessor(p1) + '}';
	});
}

export function propertyAccessor(name: string): string {
	return name.match(VAR_NAME_REGEX) ? `.${name}` : `['${name}']`;
}

export const METHODS_WITH_BODY = ['post', 'put', 'patch'];

export type IParameterLocation = 'query' | 'header' | 'path' | 'cookie';

export function processParams(param: OpenAPIV3.ParameterObject): IObjectProps {
	const resolvedValue = param.schema ? resolveValue(param.schema, '') : undefined;

	return {
		key: param.name,
		value: resolvedValue?.code || 'unknown',
		comment: liquid.renderSync(COMMENTS_TEMPLATE, { schema: param.schema }),
		required: param.in === 'path' ? true : !!param.required,
		dependencies: resolvedValue?.dependencies || [],
		imports: resolvedValue?.imports || [],
	};
}
