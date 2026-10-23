import { describe, test, expect } from 'vitest';

import { getRequestResponseSchema, isEventStreamOperation, isEventStreamResponse } from '../src/codegen.mjs';

describe('isEventStreamResponse', () => {
	test('returns true when the response declares a text/event-stream content type', () => {
		expect(
			isEventStreamResponse({
				description: 'ok',
				content: {
					'text/event-stream': {
						schema: { type: 'object' },
					},
				},
			}),
		).toBe(true);
	});

	test('returns false when the response has no text/event-stream content type', () => {
		expect(
			isEventStreamResponse({
				description: 'ok',
				content: {
					'application/json': {
						schema: { type: 'object' },
					},
				},
			}),
		).toBe(false);
	});

	test('returns false for $ref responses', () => {
		expect(isEventStreamResponse({ $ref: '#/components/responses/Foo' })).toBe(false);
	});

	test('returns false when there is no content at all', () => {
		expect(isEventStreamResponse({ description: 'no content' })).toBe(false);
	});
});

describe('isEventStreamOperation', () => {
	test('returns true when a 2xx response is an event stream', () => {
		expect(
			isEventStreamOperation({
				'200': {
					description: 'ok',
					content: { 'text/event-stream': { schema: { type: 'object' } } },
				},
				'404': {
					description: 'not found',
					content: { 'application/json': { schema: { type: 'object' } } },
				},
			}),
		).toBe(true);
	});

	test('returns false when no response is an event stream', () => {
		expect(
			isEventStreamOperation({
				'200': {
					description: 'ok',
					content: { 'application/json': { schema: { type: 'object' } } },
				},
			}),
		).toBe(false);
	});

	test('returns false for an empty responses object', () => {
		expect(isEventStreamOperation({})).toBe(false);
		expect(isEventStreamOperation(undefined)).toBe(false);
	});

	test('ignores event streams declared on error responses', () => {
		expect(
			isEventStreamOperation({
				'500': {
					description: 'error',
					content: { 'text/event-stream': { schema: { type: 'object' } } },
				},
			}),
		).toBe(false);
	});
});

describe('getRequestResponseSchema with text/event-stream', () => {
	test('resolves the schema declared under text/event-stream', () => {
		const schema = { type: 'object', properties: { status: { type: 'string' } } };

		expect(
			getRequestResponseSchema({
				description: 'An event stream',
				content: { 'text/event-stream': { schema } },
			}),
		).toEqual(schema);
	});
});
