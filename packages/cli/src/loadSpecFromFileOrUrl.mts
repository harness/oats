import fs from 'node:fs';
import path from 'node:path';

import fetch from 'node-fetch';
import type { OpenAPIV3 } from 'openapi-types';
import yaml from 'js-yaml';

import { generateOpenAPISpec } from './generateOpenAPISpec.mjs';
import {
	generateGithubApiEndpointUrl,
	GITHUB_PAT,
	_convertToOpenAPI,
	b64DecodeUnicode,
	logInfo,
} from './helpers.mjs';
import type { IServiceConfig } from './config.mjs';
import type { IPluginReturn } from './plugin.mjs';

/**
 * Loads spec file/url and creates code from the spec
 */
export async function loadSpecFromFileOrUrl(config: IServiceConfig): Promise<IPluginReturn> {
	let spec: OpenAPIV3.Document | undefined;

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
			throw new Error('Something went wrong while trying to parse contents from FILE');
		}

		// transform the spec using given transformer
	} else if (config.url) {
		// read from URL
		logInfo('Fetching data from URL');

		if (!GITHUB_PAT && !process.env.CI) {
			throw new Error(
				'GITHUB_PAT (Personal Access Token) is not defined, please set GITHUB_PAT environment variable',
			);
		}

		const configUrl = process.env.CI ? config.url : generateGithubApiEndpointUrl(config.url);
		const configHeaders = process.env.CI
			? {}
			: { headers: { Authorization: `Bearer ${GITHUB_PAT}` } };

		const response = await fetch(configUrl, {
			...configHeaders,
		});

		const contentType = response.headers.get('Content-Type');
		try {
			logInfo('Parsing data from API');
			if (contentType === 'application/json; charset=utf-8') {
				const responseJson: any = await response.json();
				const yamlContent = responseJson.content;
				spec = yaml.load(b64DecodeUnicode(yamlContent)) as OpenAPIV3.Document;

				logInfo(`Detected format: JSON`);
			} else {
				const txt = await response.text();
				spec = yaml.load(txt) as OpenAPIV3.Document;

				logInfo(`Detected format: YAML`);
			}
		} catch (_) {
			throw new Error('Something went wrong while trying to parse contents from URL');
		}
	} else {
		throw new Error('Neither file nor url provided');
	}

	if (!spec) {
		throw new Error(`Could not resolve OpenAPI spec from "${config.file || config.url}"`);
	}

	if (!spec.info || !spec.info.version.startsWith('3.')) {
		logInfo('Converting spec from Swagger to OpenAPI');
		spec = await _convertToOpenAPI(spec);
	}

	if (config.transformer) {
		logInfo(`Transforming schema using "${config.transformer}"`);

		spec = config.transformer(spec);
	}

	return generateOpenAPISpec(spec, config);
}
