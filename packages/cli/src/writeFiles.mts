/* eslint-disable import/no-named-as-default-member */
import fs from 'fs';
import path from 'path';

// import { identity, mapValues, sortBy, uniq } from 'lodash-es';
import prettier from 'prettier';

import type { ICLIConfig, IServiceConfig } from './config.mjs';
import type { IPluginReturn } from './plugin.mjs';
import { logError, logInfo } from './helpers.mjs';
// import { INDEX_TEMPLATE, liquid } from './codegen.mjs';

export async function writeFiles(
	data: IPluginReturn,
	options: Pick<ICLIConfig, 'clean'> &
		Pick<IServiceConfig, 'fileHeader' | 'output' | 'genOnlyUsed'>,
	prettierOptions: prettier.Options | null,
): Promise<void> {
	const { clean, output, fileHeader } = options;
	const uniqDirs = new Set<string>();

	// collect all the sub directory paths
	data.files.forEach((file) => {
		uniqDirs.add(path.dirname(file.filepath));
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
		try {
			let code = file.code;

			if (fileHeader) {
				code = `${fileHeader}\n${code}`;
			}

			logInfo(`Prettifying file: ${file.filepath}`);
			const formattedCode = prettier.format(code, {
				...(prettierOptions || {}),
				parser: 'typescript',
			});
			logInfo(`Writing file: ${file.filepath}`);
			await fs.promises.writeFile(path.resolve(output, file.filepath), formattedCode, 'utf8');
		} catch (e) {
			logError(`Tried formatting and write the following code: ${file.code}`);
			process.exit(1);
		}
	}

	// if (data.indexIncludes) {
	// 	logInfo(`Prettifying file: index.ts`);
	// 	const uniqueIncludes = mapValues(data.indexIncludes, (val) => ({
	// 		types: sortBy(uniq(val.types), identity),
	// 		exports: sortBy(uniq(val.exports), identity),
	// 	}));
	// 	const formattedCode = prettier.format(
	// 		liquid.renderSync(INDEX_TEMPLATE, { includes: uniqueIncludes }),
	// 		{
	// 			...(prettierOptions || {}),
	// 			parser: 'typescript',
	// 		},
	// 	);

	// 	logInfo(`Writing file: index.ts`);
	// 	await fs.promises.writeFile(path.resolve(output, 'index.ts'), formattedCode, 'utf8');
	// }
}
