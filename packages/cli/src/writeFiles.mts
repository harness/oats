/* eslint-disable import/no-named-as-default-member */
import fs from 'fs';
import path from 'path';

import { identity, sortBy, uniq } from 'lodash-es';
import prettier from 'prettier';

import type { ICLIConfig, IServiceConfig } from './config.mjs';
import type { IPluginReturn } from './plugin.mjs';
import { logError, logInfo } from './helpers.mjs';

function sortedUniq(items: string[]): string[] {
	return sortBy(uniq(items), identity);
}

function removeExtension(str: string): string {
	return str.split('.').slice(0, -1).join('.');
}

export async function writeFiles(
	data: IPluginReturn,
	options: Pick<ICLIConfig, 'clean'> &
		Pick<IServiceConfig, 'fileHeader' | 'output' | 'genOnlyUsed'>,
	prettierOptions: prettier.Options | null,
): Promise<void> {
	const { clean, output, fileHeader } = options;
	const uniqDirs = new Set<string>();
	const exportsStatements: Array<[string, string]> = [];

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

			if (file.typeExports.length > 0) {
				exportsStatements.push([
					file.filepath,
					`export type { ${sortedUniq(file.typeExports).join(', ')} } from "./${removeExtension(
						file.filepath,
					)}"`,
				]);
			}

			if (file.jsExports.length > 0) {
				exportsStatements.push([
					file.filepath,
					`export { ${sortedUniq(file.jsExports).join(', ')} } from "./${removeExtension(
						file.filepath,
					)}"`,
				]);
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

	if (exportsStatements.length > 0) {
		logInfo(`Prettifying file: index.ts`);
		const sortedExports = sortBy(exportsStatements, (p) => p[0]).map((p) => p[1]);
		const formattedCode = prettier.format(uniq(sortedExports).join('\n'), {
			...(prettierOptions || {}),
			parser: 'typescript',
		});

		logInfo(`Writing file: index.ts`);
		await fs.promises.writeFile(path.resolve(output, 'index.ts'), formattedCode, 'utf8');
	}
}
