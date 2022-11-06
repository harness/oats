import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { globby } from 'globby';
import type { SchemaObject } from 'openapi3-ts';
import { load } from 'js-yaml';
import { format } from 'prettier';
import prettierConfig from '../../../.prettierrc.cjs';

export interface IFixture {
	title: string;
	name: string;
	spec: SchemaObject;
	code: string;
}

export async function loadFixturesFromDir(dir: string): Promise<IFixture[]> {
	const files = await globby([
		path.resolve(path.dirname(fileURLToPath(import.meta.url)), dir, '*.fixture'),
	]);

	const promises = files.map(async (file) => {
		const contents = await fs.readFile(file, 'utf8');
		const [meta, code] = contents.split('---');
		const parsed = load(meta.replace(/\t/g, '  ')) as IFixture;

		return {
			...parsed,
			code: code.trim(),
		};
	});

	return Promise.all(promises);
}

export function prettify(code: string): string {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return format(code, { ...(prettierConfig as any), parser: 'typescript' });
}

export interface IT {
	[key: string]: string;
}
