import { z } from 'zod';

import { Plugin, OpenAPIObj } from './plugin.mjs';

export const CLIConfig = z.object({
	output: z.string(),
	file: z.string().optional(),
	url: z.string().optional(),
	config: z.string().optional(),
	clean: z.boolean().optional(),
	genOnlyUsed: z.boolean().optional(),
	service: z.array(z.string()).optional(),
});

export type ICLIConfig = z.infer<typeof CLIConfig>;

export const ServiceConfig = z.object({
	output: z.string(),
	file: z.string().optional(),
	url: z.string().optional(),
	transformer: z.function(z.tuple([OpenAPIObj]), OpenAPIObj).optional(),
	plugins: z.array(Plugin).optional(),
	fileHeader: z.string().optional(),
	genOnlyUsed: z.boolean().optional(),
});

export type IServiceConfig = z.infer<typeof ServiceConfig>;

export const Config = z.object({
	plugins: z.array(Plugin).optional(),
	services: z.record(z.string(), ServiceConfig),
});

export type IConfig = z.infer<typeof Config>;

export function defineConfig(config: IConfig): IConfig {
	return config;
}
