import { describe, test, expect } from 'vitest';

import { createInterface } from '../src/codegen.mjs';
import { loadFixturesFromDir, prettify } from './testUtils';

describe('createInterfaces Tests', async () => {
	const fixtures = await loadFixturesFromDir('fixtures/createInterface');

	fixtures.forEach(({ title, name, spec, code, components }) => {
		test(title, () => {
			const { code: expectedCode } = createInterface({
				name,
				originalRef: '',
				components: components || {},
				schema: spec,
			});

			expect(prettify(expectedCode).trimEnd()).toBe(code.trimEnd());
		});
	});
});
