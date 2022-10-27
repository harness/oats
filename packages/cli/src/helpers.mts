import swagger2openapi from 'swagger2openapi';
import type { OpenAPIObject, ReferenceObject } from 'openapi3-ts';
import chalk from 'chalk';
import { has } from 'lodash-es';

export function convertToOpenAPI(schema: unknown): Promise<OpenAPIObject> {
	return new Promise((resolve, reject) => {
		swagger2openapi.convertObj(schema, {}, (err, convertedObj) => {
			if (err) {
				reject(err);
			} else {
				resolve(convertedObj.openapi);
			}
		});
	});
}

export function isReferenceObject(data: unknown): data is ReferenceObject {
	return typeof data === 'object' && data !== null && has(data, '$ref');
}

export function logInfo(msg: string): void {
	if (process.env.DEBUG_OATS === 'true') {
		console.log(chalk.cyan(`oa2ts: [INFO]: ${msg}`));
	}
}

export function logWarning(msg: string): void {
	console.log(chalk.yellow(`oa2ts: [WARN]: ${msg}`));
}

export function logError(msg: string): void {
	console.log(chalk.red(`oa2ts: [ERROR]: ${msg}`));
}

export function padChunk(chunk: string, spacing = 6): string {
	return chunk
		.split('\n')
		.map((line) => ' '.repeat(spacing) + line)
		.join('\n');
}
