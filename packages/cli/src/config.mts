import type { OpenAPIObject } from 'openapi3-ts';
import * as Yup from 'yup';

import { getPluginSchema, type Plugin } from './plugin.mjs';

export interface CLIConfig {
	output: string;
	file?: string;
	url?: string;
	config?: string;
	clean: boolean;
	service: string[];
}

export const getServiceConfigSchema = (): Yup.AnyObjectSchema =>
	Yup.object({
		output: Yup.string().required(),
		file: Yup.string(),
		url: Yup.string(),
		transformer: Yup.mixed().test(function (value) {
			if (value && typeof value !== 'function') {
				return this.createError({ message: `Expected to be a function, but got: ${typeof value}` });
			}

			return true;
		}),
		plugins: Yup.array(getPluginSchema().required()),
	}).test(function (obj: any) {
		if ((!obj.file || !obj.file.length) && (!obj.url || !obj.url.length)) {
			return this.createError({ message: 'Either file or url is required' });
		}

		return true;
	});

export const getConfigSchema = (): Yup.AnyObjectSchema =>
	Yup.object({
		plugins: Yup.array(getPluginSchema().required()),
		services: Yup.lazy((obj) => {
			const schema = Object.keys(obj).reduce(
				(p, c) => ({ ...p, [c]: getServiceConfigSchema().required() }),
				{},
			);
			return Yup.object(schema).required();
		}),
	});

export interface ServiceConfig {
	/**
	 * Path where the output should be written to.
	 */
	output: string;
	/**
	 * Path from where the OpenAPI spec is to be read.
	 */
	file?: string;
	/**
	 * URL from where the OpenAPI spec is to be read.
	 */
	url?: string;
	/**
	 * A function, which can be used to pre-process the imported spec.
	 */
	transformer?: (spec: Readonly<OpenAPIObject>) => OpenAPIObject;
	/**
	 * Plugins to be overriden for this particular service.
	 * The plugins will be replaced and not merged.
	 */
	plugins?: Plugin[];
}

export interface Config {
	plugins?: Plugin[];
	services: Record<string, ServiceConfig>;
}

export function defineConfig(config: Config): Config {
	return config;
}
