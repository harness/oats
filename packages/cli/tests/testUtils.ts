import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { globby } from 'globby';
import { SchemaObject } from 'openapi3-ts';
import { load } from 'js-yaml';

export interface Fixture {
  title: string;
  name: string;
  spec: SchemaObject;
  code: string;
}

export async function loadFixturesFromDir(dir: string): Promise<Fixture[]> {
  const files = await globby([
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), dir, '*.fixture')
  ]);

  const promises = files.map(async file => {
    const contents = await fs.readFile(file, 'utf8');
    const [meta, code] = contents.split('---');
    const parsed = load(meta) as Fixture;

    return {
      ...parsed,
      code: code.trim()
    };
  });

  return Promise.all(promises);
}
