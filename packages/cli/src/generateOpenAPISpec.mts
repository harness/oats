import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { OpenAPIObject } from 'openapi3-ts';
import { forEach } from 'lodash-es';

import type { PluginReturn, Plugin, CodeOutput, PluginExports } from './plugin.mjs';
import { getPluginReturnSchema } from './plugin.mjs';
import { logInfo } from './helpers.mjs';
import { Codegen } from './codegen.mjs';

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url));

export async function generateOpenAPISpec(
	spec: OpenAPIObject,
	plugins: Plugin[] = [],
): Promise<PluginReturn & { codegen: Codegen }> {
	const files: CodeOutput[] = [];
	const indexIncludes: Record<string, PluginExports> = {};
	const templatePaths = plugins.map((p) => p.templatesPath).filter((p) => p) as string[];
	const codegen = new Codegen([path.resolve(DIR_NAME, 'templates'), ...templatePaths]);

	if (spec.components?.schemas) {
		logInfo('Generating schema definitions');
		const schemaDefs = codegen.createSchemaDefinitions(spec.components.schemas);
		files.push(...schemaDefs.files);

		if (schemaDefs.indexIncludes) {
			forEach(schemaDefs.indexIncludes, (val, key) => {
				if (!indexIncludes[key]) {
					indexIncludes[key] = { types: [], exports: [] };
				}

				indexIncludes[key].exports.push(...val.exports);
				indexIncludes[key].types.push(...val.types);
			});
		}
	}

	if (spec.components?.requestBodies) {
		logInfo('Generating request body definitions');
		const requestBodyDefs = codegen.createRequestBodyDefinitions(spec.components.requestBodies);

		files.push(...requestBodyDefs.files);

		if (requestBodyDefs.indexIncludes) {
			forEach(requestBodyDefs.indexIncludes, (val, key) => {
				if (!indexIncludes[key]) {
					indexIncludes[key] = { types: [], exports: [] };
				}

				indexIncludes[key].exports.push(...val.exports);
				indexIncludes[key].types.push(...val.types);
			});
		}
	}

	if (spec.components?.responses) {
		logInfo('Generating response definitions');

		const responseDefs = codegen.createResponseDefinitions(spec.components.responses);

		files.push(...responseDefs.files);

		if (responseDefs.indexIncludes) {
			forEach(responseDefs.indexIncludes, (val, key) => {
				if (!indexIncludes[key]) {
					indexIncludes[key] = { types: [], exports: [] };
				}

				indexIncludes[key].exports.push(...val.exports);
				indexIncludes[key].types.push(...val.types);
			});
		}
	}

	if (Array.isArray(plugins)) {
		for (const plugin of plugins) {
			logInfo(`Executing plugin: ${plugin.name}`);
			const pluginData = await plugin.generate(spec, codegen);

			// validate plugin data
			await getPluginReturnSchema().validate(pluginData);

			files.push(...pluginData.files);

			if (pluginData.indexIncludes) {
				forEach(pluginData.indexIncludes, (val, key) => {
					if (!indexIncludes[key]) {
						indexIncludes[key] = { types: [], exports: [] };
					}

					indexIncludes[key].exports.push(...val.exports);
					indexIncludes[key].types.push(...val.types);
				});
			}
		}
	}

	return { files, indexIncludes, codegen };
}
