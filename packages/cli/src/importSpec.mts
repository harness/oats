/* eslint-disable import/no-named-as-default-member */
import fs from 'fs';
import path from 'path';
import * as esbuild from 'esbuild';
import prettier from 'prettier';
import ora from 'ora';
import type { Ora } from 'ora';

import type { ICLIConfig, IConfig } from './config.mjs';
import { Config } from './config.mjs';
import { loadSpecFromFileOrUrl } from './loadSpecFromFileOrUrl.mjs';
import { logInfo } from './helpers.mjs';
import { writeFiles } from './writeFiles.mjs';

/**
 * Resolves config and imports spec
 */
export async function importSpec(argv: ICLIConfig): Promise<void> {
	const cwd = process.cwd();
	const prettierConfig = await prettier.resolveConfig(cwd);
	let spinner: Ora | undefined;

	if (argv.config) {
		const configFilePath = path.resolve(cwd, argv.config);
		logInfo(`Resolve config file to: ${configFilePath}`);
		const builtConfig = `oats.config.${new Date().getTime()}`;
		const builtConfigPath = path.resolve(cwd, `${builtConfig}.mjs`);
		let configFileDeleted = false;

		try {
			logInfo(`Building config file: ${argv.config}`);
			await esbuild.build({
				entryPoints: { [builtConfig]: configFilePath },
				target: 'node16',
				outdir: cwd,
				outExtension: { '.js': '.mjs' },
			});

			logInfo(`Loading built config file: ${builtConfigPath}`);
			const { default: config } = (await import(builtConfigPath)) as { default: IConfig };

			logInfo(`Deleting transpiled config file: ${builtConfigPath}`);
			await fs.promises.unlink(builtConfigPath);
			configFileDeleted = true;

			logInfo(`Validating config`);
			await Config.parseAsync(config);

			const services =
				argv.service && argv.service.length > 0 ? argv.service : Object.keys(config.services);

			for (const service of services) {
				spinner = ora(`Generating spec for: ${service}`).start();
				const serviceConfig = config.services[service];

				if (!serviceConfig) {
					throw new Error(`Cound not find ${service}`);
				}

				// apply global plugins if local plugins are not present
				if (config.plugins && !serviceConfig.plugins) {
					serviceConfig.plugins = config.plugins;
				}

				const data = await loadSpecFromFileOrUrl(serviceConfig);
				await writeFiles(
					data,
					{ output: serviceConfig.output, clean: argv.clean, fileHeader: serviceConfig.fileHeader },
					prettierConfig,
				);
				spinner.succeed(`Generated spec for: ${service}`);
			}
		} catch (e) {
			logInfo(`Deleting transpiled config file due to error: ${builtConfigPath}`);

			if (!configFileDeleted) {
				await fs.promises.unlink(builtConfigPath);
			}
			spinner?.fail();
			throw e;
		}
	} else {
		spinner = ora(`Generating spec`).start();
		try {
			const data = await loadSpecFromFileOrUrl(argv);
			await writeFiles(
				data,
				{ output: argv.output, clean: argv.clean, genOnlyUsed: argv.genOnlyUsed },
				prettierConfig,
			);
			spinner.succeed(`Generated spec`);
		} catch (e) {
			spinner.fail();
			throw e;
		}
	}
}
