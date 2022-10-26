import type { OpenAPIObject } from 'openapi3-ts';
import * as Yup from 'yup';

import type { Codegen } from './codegen.mjs';

export const getCodeOutputSchema = (): Yup.AnyObjectSchema =>
	Yup.object({
		code: Yup.string().required(),
		file: Yup.string().required(),
	}).required();

export const getPluginReturnSchema = (): Yup.AnyObjectSchema =>
	Yup.object({
		files: Yup.array(getCodeOutputSchema()).min(1).required(),
		indexInclude: Yup.string(),
	}).required();

export const getPluginSchema = (): Yup.AnyObjectSchema =>
	Yup.object({
		name: Yup.string().required(),
		generate: Yup.mixed()
			.test(function (value) {
				if (typeof value !== 'function') {
					return this.createError({
						message: `Expected to be a function, but got: ${typeof value}`,
					});
				}

				return true;
			})
			.required(),
	});

export interface CodeOutput {
	code: string;
	file: string;
}

export interface PluginReturn {
	files: CodeOutput[];
	indexInclude?: string;
}

export interface Plugin {
	name: string;
	generate: (spec: Readonly<OpenAPIObject>, codegen: Codegen) => Promise<PluginReturn>;
	templatesPath?: string;
}
