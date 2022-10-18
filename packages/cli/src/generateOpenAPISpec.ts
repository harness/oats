import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { OpenAPIObject } from 'openapi3-ts';

import type { PluginReturn, Plugin } from './plugin.js';
import { getPluginReturnSchema } from './plugin.js';
import { logInfo } from './helpers.js';
import { Codegen } from './codegen.js';

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url));

export async function generateOpenAPISpec(
	spec: OpenAPIObject,
	plugins: Plugin[] = [],
): Promise<PluginReturn> {
	const allData: PluginReturn = { files: [], indexInclude: '' };
	const templatePaths = plugins.map((p) => p.templatesPath).filter((p) => p) as string[];
	const codegen = new Codegen([path.resolve(DIR_NAME, 'templates'), ...templatePaths]);

	if (spec.components?.schemas) {
		logInfo('Generating schema definitions');
		const schemaDefs = codegen.createSchemaDefinitions(spec.components.schemas);
		allData.files.push(...schemaDefs.files);

		if (schemaDefs.indexInclude) {
			allData.indexInclude += schemaDefs.indexInclude;
			allData.indexInclude += '\n';
		}
	}

	if (spec.components?.requestBodies) {
		logInfo('Generating request body definitions');
		const requestBodyDefs = codegen.createRequestBodyDefinitions(spec.components.requestBodies);

		allData.files.push(...requestBodyDefs.files);

		if (requestBodyDefs.indexInclude) {
			allData.indexInclude += requestBodyDefs.indexInclude;
			allData.indexInclude += '\n';
		}
	}

	if (Array.isArray(plugins)) {
		for (const plugin of plugins) {
			logInfo(`Executing plugin: ${plugin.name}`);
			const pluginData = await plugin.generate(spec, codegen);

			// validate plugin data
			await getPluginReturnSchema().validate(pluginData);

			allData.files.push(...pluginData.files);

			if (pluginData.indexInclude) {
				allData.indexInclude += pluginData.indexInclude;
				allData.indexInclude += '\n';
			}
		}
	}

	return allData;
}
