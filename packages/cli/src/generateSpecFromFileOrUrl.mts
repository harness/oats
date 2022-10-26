import fs from 'node:fs';
import path from 'node:path';

import fetch from 'node-fetch';
import type { OpenAPIObject } from 'openapi3-ts';
import yaml from 'js-yaml';

import { generateOpenAPISpec } from './generateOpenAPISpec.mjs';
import { convertToOpenAPI, logInfo } from './helpers.mjs';
import type { ServiceConfig } from './config.mjs';
import type { PluginReturn } from './plugin.mjs';

/**
 * Loads spec file/url and creates code from the spec
 */
export async function generateSpecFromFileOrUrl(config: ServiceConfig): Promise<PluginReturn> {
	let spec: OpenAPIObject | undefined;

	if (config.file) {
		const ext = path.extname(config.file);
		const format = /\.ya?ml$/i.test(ext) ? 'yaml' : 'json';
		const filePath = path.resolve(process.cwd(), config.file);

		logInfo(`Detected format: ${format}`);
		logInfo(`Reading file "${filePath}"`);

		const content = await fs.promises.readFile(filePath, 'utf8');

		logInfo('Parsing data from file');
		try {
			spec =
				format === 'yaml'
					? yaml.load(content, { json: true, schema: yaml.JSON_SCHEMA })
					: JSON.parse(content);
		} catch (_) {
			throw new Error('Something went wrong while trying to parse contents');
		}

		// transform the spec using given transformer
	} else if (config.url) {
		// read from URL
		logInfo('Fetching data from URL');
		const response = await fetch(config.url);
		const contentType = response.headers.get('Content-Type');
		try {
			logInfo('Parsing data from API');

			if (contentType === 'application/json') {
				spec = (await response.json()) as OpenAPIObject;
				logInfo(`Detected format: JSON`);
			} else {
				const txt = await response.text();
				spec = yaml.load(txt) as OpenAPIObject;
				logInfo(`Detected format: YAML`);
			}
		} catch (_) {
			throw new Error('Something went wrong while trying to parse contents');
		}
	} else {
		throw new Error('Neither file nor url provided');
	}

	if (!spec) {
		throw new Error(`Could not resolve OpenAPI spec from "${config.file || config.url}"`);
	}

	if (config.transformer) {
		logInfo(`Transforming schema using "${config.transformer}"`);

		spec = config.transformer(spec);
	}

	if (!spec.info || !spec.info.version.startsWith('3.')) {
		logInfo('Converting spec from Swagger to OpenAPI');
		spec = await convertToOpenAPI(spec);
	}

	return generateOpenAPISpec(spec, config.plugins);
}
