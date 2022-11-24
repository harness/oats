import { describe, test, expect } from 'vitest';

import { pathToTemplate } from '../src/helpers.mjs';

describe('Helpers test', () => {
	test('pathToTemplate tests', () => {
		expect(pathToTemplate('/my-path/{myVar}')).toEqual('/my-path/${props.myVar}');
		expect(pathToTemplate('/my-path/{my-var}')).toEqual("/my-path/${props['my-var']}");
		expect(pathToTemplate('/my-path/{myVar1}')).toEqual('/my-path/${props.myVar1}');
	});
});
