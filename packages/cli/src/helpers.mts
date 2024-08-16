/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import swagger2openapi from 'swagger2openapi';
import type { OpenAPIV3 } from 'openapi-types';
import chalk from 'chalk';
import { has } from 'lodash-es';

const DIR_NAME = getDirNameForCurrentFile(import.meta);

export const GITHUB_PAT = process.env.GITHUB_PAT;
const DEFAULT_BRANCH = 'develop';
const URL_PREFIX = 'https://api.github.com/repos/harness/harness-core/contents/';
// const yamlPath = '120-ng-manager/contracts/openapi/v1/openapi.yaml';
export const GITHUB_API_ENDPOINT_URL = (yamlPath: string) =>
	`${URL_PREFIX}${yamlPath}?ref=${DEFAULT_BRANCH}`;

// internal function
export function _convertToOpenAPI(schema: unknown): Promise<OpenAPIV3.Document> {
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

// internal function
export function _readTemplate(name: string): string {
	return fs.readFileSync(path.resolve(DIR_NAME, `./templates/${name}`), 'utf8');
}

export function isReferenceObject(data: unknown): data is OpenAPIV3.ReferenceObject {
	return typeof data === 'object' && data !== null && has(data, '$ref');
}

export function logInfo(msg: string): void {
	if (process.env.DEBUG_OATS === 'true') {
		console.log(chalk.cyan(`\noa2ts: [INFO]: ${msg}`));
	}
}

export function logWarning(msg: string): void {
	console.log(chalk.yellow(`\noa2ts: [WARN]: ${msg}`));
}

export function logError(msg: string): void {
	console.log(chalk.red(`\noa2ts: [ERROR]: ${msg}`));
}

export function getDirNameForCurrentFile(meta: ImportMeta): string {
	return path.dirname(fileURLToPath(meta.url));
}

export function pathToTemplate(val: string): string {
	return val.replace(/\{/g, '${');
}

export async function readStreamContent(stream: any): Promise<string> {
	const reader = stream.getReader();
	let decoder = new TextDecoder(); // Use TextDecoder for text data

	let result = '';
	let done = false;

	while (!done) {
		const { value, done: streamDone } = await reader.read();
		done = streamDone;

		if (value) {
			result += decoder.decode(value, { stream: !done });
		}
	}

	reader.releaseLock();
	return result;
}

export function b64DecodeUnicode(str: any) {
	// Going backwards: from bytestream, to percent-encoding, to original string.
	return decodeURIComponent(
		atob(str)
			.split('')
			.map(function (c) {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
			})
			.join(''),
	);
}
