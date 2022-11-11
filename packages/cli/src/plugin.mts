import type { OpenAPIV3 } from 'openapi-types';
import { z } from 'zod';

export const CodeOutput = z.object({
	code: z.string(),
	filepath: z.string(),
	ref: z.string(),
	jsExports: z.array(z.string()),
	typeExports: z.array(z.string()),
	dependencies: z.array(z.string()),
});

export type ICodeOutput = z.infer<typeof CodeOutput>;

export const PluginReturn = z.object({
	files: z.array(CodeOutput),
});

export type IPluginReturn = z.infer<typeof PluginReturn>;

export const OpenAPIObj: z.ZodType<Readonly<OpenAPIV3.Document>> = z.any();

export const Plugin = z.object({
	name: z.string(),
	generate: z.function(z.tuple([OpenAPIObj]), z.promise(PluginReturn)),
});

export type IPlugin = z.infer<typeof Plugin>;
