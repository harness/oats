/* eslint-disable import/no-named-as-default-member */
import fs from 'fs';
import path from 'path';

import { identity, mapValues, sortBy, uniq } from 'lodash-es';
import prettier from 'prettier';

import type { CLIConfig, ServiceConfig } from './config.mjs';
import type { PluginReturn } from './plugin.mjs';
import { logError, logInfo } from './helpers.mjs';
import type { Codegen } from './codegen.mjs';

export async function writeFiles(
	data: PluginReturn & { codegen: Codegen },
	options: Pick<CLIConfig, 'clean'> & Pick<ServiceConfig, 'fileHeader' | 'output'>,
	prettierOptions: prettier.Options | null,
): Promise<void> {
	const { clean, output, fileHeader } = options;
	const uniqDirs = new Set<string>();

	// collect all the sub directory paths
	data.files.forEach((file) => {
		uniqDirs.add(path.dirname(file.file));
	});

	// remove the output directory if the flag is set
	if (clean) {
		await fs.promises.rm(output, { recursive: true, force: true });
	}

	// make sure the output directory exists
	if (!fs.existsSync(output)) {
		logInfo(`Creating output directory: ${output}`);
		await fs.promises.mkdir(output, { recursive: true });
	}

	// make sure all the sub directories exits
	for (const dir of uniqDirs) {
		const fullPath = path.resolve(output, dir);

		if (!fs.existsSync(fullPath)) {
			await fs.promises.mkdir(fullPath, { recursive: true });
		}
	}

	for (const file of data.files) {
		logInfo(`Prettifying file: ${file.file}`);
		try {
			let code = file.code;

			if (fileHeader) {
				code = `${fileHeader}\n${code}`;
			}

			const formattedCode = prettier.format(code, {
				...(prettierOptions || {}),
				parser: 'typescript',
			});
			logInfo(`Writing file: ${file.file}`);
			await fs.promises.writeFile(path.resolve(output, file.file), formattedCode, 'utf8');
		} catch (e) {
			logError(`Tried formatting and write the following code: ${file.code}`);
			process.exit(1);
		}
	}

	if (data.indexIncludes) {
		logInfo(`Prettifying file: index.ts`);
		const uniqueIncludes = mapValues(data.indexIncludes, (val) => ({
			types: sortBy(uniq(val.types), identity),
			exports: sortBy(uniq(val.exports), identity),
		}));
		const formattedCode = prettier.format(
			data.codegen.renderTemplate('indexIncludes', { includes: uniqueIncludes }),
			{
				...(prettierOptions || {}),
				parser: 'typescript',
			},
		);

		logInfo(`Writing file: index.ts`);
		await fs.promises.writeFile(path.resolve(output, 'index.ts'), formattedCode, 'utf8');
	}
}
