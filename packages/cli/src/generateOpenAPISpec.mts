import type { OpenAPIV3 } from 'openapi-types';
import { uniq } from 'lodash-es';

import type { IPluginReturn, ICodeOutput } from './plugin.mjs';
import { PluginReturn } from './plugin.mjs';
import { logInfo } from './helpers.mjs';
import type { IServiceConfig } from './config.mjs';
import {
	createRequestBodyDefinitions,
	createResponseDefinitions,
	createSchemaDefinitions,
} from './codegen.mjs';

export async function generateOpenAPISpec(
	spec: OpenAPIV3.Document,
	config: IServiceConfig,
): Promise<IPluginReturn> {
	const files: ICodeOutput[] = [];
	const components: Record<string, ICodeOutput> = {};
	let dependencies: string[] = [];

	if (spec.components?.schemas) {
		logInfo('Generating schema definitions');
		const schemaDefs = createSchemaDefinitions(spec.components);

		Object.assign(components, schemaDefs);
	}

	if (spec.components?.requestBodies) {
		logInfo('Generating request body definitions');
		const requestBodyDefs = createRequestBodyDefinitions(spec.components);

		Object.assign(components, requestBodyDefs);
	}

	if (spec.components?.responses) {
		logInfo('Generating response definitions');

		const responseDefs = createResponseDefinitions(spec.components);

		Object.assign(components, responseDefs);
	}

	if (Array.isArray(config.plugins)) {
		for (const plugin of config.plugins) {
			logInfo(`Executing plugin: ${plugin.name}`);
			const pluginData = await plugin.generate(spec);

			// validate plugin data
			await PluginReturn.parseAsync(pluginData);

			pluginData.files.forEach((file) => {
				files.push(file);
				dependencies.push(...file.dependencies);
			});
		}
	}

	if (config.genOnlyUsed) {
		// generate only required types using dependency graph
		dependencies = uniq(dependencies);

		let i = 0;

		while (i < dependencies.length) {
			const dependency = dependencies[i];
			const component = components[dependency];

			if (component) {
				files.push(component);
				dependencies = uniq([...dependencies, ...component.dependencies]);
			}

			i++;
		}
	} else {
		// generate all files
		files.push(...Object.values(components));
	}

	return { files };
}
