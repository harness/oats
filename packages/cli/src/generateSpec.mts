/* eslint-disable import/no-named-as-default-member */
import fs from 'fs';
import path from 'path';
import * as esbuild from 'esbuild';
import prettier from 'prettier';
import ts from 'typescript';

import type { CLIConfig, Config } from './config.mjs';
import type { PluginReturn } from './plugin.mjs';
import { getConfigSchema } from './config.mjs';
import { generateSpecFromFileOrUrl } from './generateSpecFromFileOrUrl.mjs';
import { logError, logInfo } from './helpers.mjs';

async function writeData(
	data: PluginReturn,
	options: Pick<CLIConfig, 'clean' | 'output'>,
	prettierOptions: prettier.Options | null,
): Promise<void> {
	const { clean, output } = options;
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
			const formattedCode = prettier.format(file.code, {
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

	if (data.indexInclude) {
		logInfo(`Prettifying file: index.ts`);
		const formattedCode = prettier.format(data.indexInclude, {
			...(prettierOptions || {}),
			parser: 'typescript',
		});

		logInfo(`Writing file: index.ts`);
		await fs.promises.writeFile(path.resolve(output, 'index.ts'), formattedCode, 'utf8');
	}
}

/**
 * Resolves config and imports spec
 */
export async function generateSpec(argv: CLIConfig): Promise<void> {
	const cwd = process.cwd();
	const prettierConfig = await prettier.resolveConfig(cwd);

	const configFile = ts.findConfigFile(cwd, ts.sys.fileExists, 'tsconfig.json');
	let moduleResolution = 'NodeJs';

	if (configFile) {
		const { config } = ts.readConfigFile(configFile, ts.sys.readFile);
		const { options } = ts.parseJsonConfigFileContent(config, ts.sys, cwd);

		if (options.moduleResolution) {
			moduleResolution = ts.ModuleResolutionKind[options.moduleResolution];
		}
	}

	logInfo(`using module resolution: ${moduleResolution}`);

	if (argv.config) {
		logInfo(`using config file: ${argv.config}`);
		const configFilePath = path.resolve(cwd, argv.config);
		logInfo(`Resolve config file to: ${configFilePath}`);
		const builtConfig = `oats.config.${new Date().getTime()}`;
		const builtConfigPath = path.resolve(cwd, `${builtConfig}.mjs`);

		try {
			logInfo(`Building config file: ${argv.config}`);
			await esbuild.build({
				entryPoints: { [builtConfig]: configFilePath },
				target: 'node16',
				outdir: cwd,
				outExtension: { '.js': '.mjs' },
			});

			logInfo(`Loading built config file: ${builtConfigPath}`);
			const { default: config } = (await import(builtConfigPath)) as { default: Config };

			logInfo(`Unlinking built config file: ${builtConfigPath}`);
			await fs.promises.unlink(builtConfigPath);

			logInfo(`Validating config`);
			await getConfigSchema().validate(config);

			const services = argv.service.length > 0 ? argv.service : Object.keys(config.services);

			for (const service of services) {
				logInfo(`Generating spec for: "${service}"`);
				const serviceConfig = config.services[service];

				if (!serviceConfig) {
					throw new Error(`Cound not find ${service}`);
				}

				// apply global plugins if local plugins are not present
				if (config.plugins && !serviceConfig.plugins) {
					serviceConfig.plugins = config.plugins;
				}

				const data = await generateSpecFromFileOrUrl(serviceConfig);
				await writeData(data, { output: serviceConfig.output, clean: argv.clean }, prettierConfig);
			}
		} catch (e) {
			await fs.promises.unlink(builtConfigPath);
			throw e;
		}
	} else {
		const data = await generateSpecFromFileOrUrl(argv);
		await writeData(data, { output: argv.output, clean: argv.clean }, prettierConfig);
	}
}
