import { describe, test, expect } from 'vitest';

import { createInterface } from '../src/codegen';
import { loadFixturesFromDir } from './testUtils';

describe('createInterfaces Tests', async () => {
  const fixtures = await loadFixturesFromDir('fixtures/createInterface');

  fixtures.forEach(({ title, name, spec, code }) => {
    test(title, () => {
      expect(createInterface(name, spec)).toBe(code);
    });
  });
});
