/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import swagger2openapi from 'swagger2openapi';
import type { OpenAPIV3 } from 'openapi-types';
import chalk from 'chalk';
import { has } from 'lodash-es';

const DIR_NAME = getDirNameForCurrentFile(import.meta);

// helpers when when working with url to generate service
export const GITHUB_PAT = process.env.GITHUB_PAT;
const ORGANIZATION = process.env.ORGANIZATION || 'harness';
const REPO = process.env.REPO || 'harness-core';
const BRANCH = process.env.BRANCH || 'develop';

const URL_PREFIX = `https://api.github.com/repos/${ORGANIZATION}/${REPO}/contents/`;

export const generateGithubApiEndpointUrl = (yamlPath: string) =>
	`${URL_PREFIX}${yamlPath}?ref=${BRANCH}`;

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
