import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { OpenAPIObject } from 'openapi3-ts';

import type { PluginReturn, Plugin, CodeOutput } from './plugin.mjs';
import { getPluginReturnSchema } from './plugin.mjs';
import { logInfo } from './helpers.mjs';
import { Codegen } from './codegen.mjs';

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url));

export async function generateOpenAPISpec(
	spec: OpenAPIObject,
	plugins: Plugin[] = [],
): Promise<PluginReturn> {
	const files: CodeOutput[] = [];
	const indexInclude = new Set<string>();
	const templatePaths = plugins.map((p) => p.templatesPath).filter((p) => p) as string[];
	const codegen = new Codegen([path.resolve(DIR_NAME, 'templates'), ...templatePaths]);

	if (spec.components?.schemas) {
		logInfo('Generating schema definitions');
		const schemaDefs = codegen.createSchemaDefinitions(spec.components.schemas);
		files.push(...schemaDefs.files);

		if (schemaDefs.indexInclude) {
			indexInclude.add(schemaDefs.indexInclude);
		}
	}

	if (spec.components?.requestBodies) {
		logInfo('Generating request body definitions');
		const requestBodyDefs = codegen.createRequestBodyDefinitions(spec.components.requestBodies);

		files.push(...requestBodyDefs.files);

		if (requestBodyDefs.indexInclude) {
			indexInclude.add(requestBodyDefs.indexInclude);
		}
	}

	if (Array.isArray(plugins)) {
		for (const plugin of plugins) {
			logInfo(`Executing plugin: ${plugin.name}`);
			const pluginData = await plugin.generate(spec, codegen);

			// validate plugin data
			await getPluginReturnSchema().validate(pluginData);

			files.push(...pluginData.files);

			if (pluginData.indexInclude) {
				indexInclude.add(pluginData.indexInclude);
			}
		}
	}

	return { files, indexInclude: [...indexInclude].join('\n') };
}
