import type {
	ReferenceObject,
	SchemaObject,
	ComponentsObject,
	RequestBodyObject,
	ResponseObject,
	ResponsesObject,
} from 'openapi3-ts';
import { has, isPlainObject, isEmpty, uniq, partition, merge } from 'lodash-es';
import { Liquid } from 'liquidjs';

import type { ICodeOutput } from './plugin.mjs';
import {
	getNameForType,
	getNameForRequestBody,
	getNameForResponse,
	getNameForParameter,
} from './nameHelpers.mjs';
import { isReferenceObject, _readTemplate } from './helpers.mjs';

export interface ICodeWithMetadata {
	code: string;
	imports: string[];
	dependencies: string[];
}

export interface IObjectProps extends Omit<ICodeWithMetadata, 'code'> {
	key: string;
	value: string;
	comment?: string;
	required?: boolean;
}

export const liquid = new Liquid();

liquid.registerFilter('js_comment', (val: string, indent = 2) =>
	val
		.split('\n')
		.map((c) => `* ${c}`.padStart(indent + c.length + 2, ''))
		.join('\n'),
);

export const OBJECT_TEMPLATE = liquid.parse(_readTemplate('object.liquid'));
export const COMMENTS_TEMPLATE = liquid.parse(_readTemplate('comments.liquid'));
export const CODE_WITH_IMPORTS_TEMPLATE = liquid.parse(_readTemplate('codeWithImports.liquid'));

export function shouldCreateInterface(
	schema: SchemaObject | ReferenceObject,
): schema is SchemaObject {
	return (
		!isReferenceObject(schema) &&
		(!schema.type || schema.type === 'object') &&
		!schema.oneOf &&
		!schema.nullable
	);
}

export function processAllOf(schema: SchemaObject): [SchemaObject, ReferenceObject[]] {
	const [allRefs, allSchemas] = partition(schema.allOf, (s) => isReferenceObject(s)) as [
		ReferenceObject[],
		SchemaObject[],
	];
	const mergedSchema = allSchemas.reduce((p, c) => merge(p, c), {} as SchemaObject);

	return [mergedSchema, allRefs];
}

export function createReferenceNode(ref: string, originalRef: string): ICodeWithMetadata {
	let path = '';
	const ret: ICodeWithMetadata = { code: '', imports: [], dependencies: [] };

	if (ref.startsWith('#/components/schemas')) {
		ret.code = getNameForType(ref.replace('#/components/schemas/', ''));
		ret.dependencies.push(ref);
		path = 'schemas';
	} else if (ref.startsWith('#/components/responses')) {
		ret.code = getNameForResponse(ref.replace('#/components/responses/', ''));
		ret.dependencies.push(ref);

		path = 'responses';
	} else if (ref.startsWith('#/components/parameters')) {
		ret.code = getNameForParameter(ref.replace('#/components/parameters/', ''));
		ret.dependencies.push(ref);

		path = 'parameters';
	} else if (ref.startsWith('#/components/requestBodies')) {
		ret.code = getNameForRequestBody(ref.replace('#/components/requestBodies/', ''));
		ret.dependencies.push(ref);
		path = 'requestBodies';
	} else {
		throw new Error(
			'This library only resolve $ref that are include into `#/components/*` for now',
		);
	}

	if (ref !== originalRef) {
		ret.imports.push(`import type { ${ret.code} } from '../${path}/${ret.code}'`);
	}

	return ret;
}

export function createObjectProperties(item: SchemaObject, originalRef: string): IObjectProps[] {
	if (!item.type && !has(item, 'properties') && !has(item, 'additionalProperties')) {
		return [];
	}

	if (item.type === 'object' && !has(item, 'properties')) {
		if (
			!has(item, 'additionalProperties') ||
			(isPlainObject(item.additionalProperties) && isEmpty(item.additionalProperties)) ||
			item.additionalProperties === true
		) {
			return [createFreeFormProperty()];
		}

		if (item.additionalProperties === false) {
			return [];
		}

		if (item.additionalProperties) {
			return [createFreeFormProperty(resolveValue(item.additionalProperties, originalRef))];
		}
	}

	if (item.properties) {
		const props = Object.keys(item.properties)
			.sort()
			.map((name): IObjectProps => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const schema = item.properties![name];
				const resolvedValue = resolveValue(schema, originalRef);

				return {
					key: name,
					value: resolvedValue.code,
					comment: liquid.renderSync(COMMENTS_TEMPLATE, { schema }),
					required: item.required?.includes(name),
					dependencies: resolvedValue.dependencies,
					imports: resolvedValue.imports,
				};
			});

		if (item.additionalProperties) {
			props.push(
				createFreeFormProperty(
					item.additionalProperties === true
						? undefined
						: resolveValue(item.additionalProperties, originalRef),
				),
			);
		}

		return props;
	}

	return [];
}

export function createObject(item: SchemaObject, originalRef: string): ICodeWithMetadata {
	if (isReferenceObject(item)) {
		return createReferenceNode(item.$ref, originalRef);
	}

	if (Array.isArray(item.allOf)) {
		const code: string[] = [];
		const dependencies: string[] = [];
		const imports: string[] = [];

		item.allOf.forEach((entry) => {
			const resolvedValue = resolveValue(entry, originalRef);
			code.push(resolvedValue.code);
			dependencies.push(...resolvedValue.dependencies);
			imports.push(...resolvedValue.imports);
		});

		return { code: code.join(' | '), dependencies, imports };
	}

	if (Array.isArray(item.oneOf)) {
		const code: string[] = [];
		const dependencies: string[] = [];
		const imports: string[] = [];

		item.oneOf.forEach((entry) => {
			const resolvedValue = resolveValue(entry, originalRef);
			code.push(resolvedValue.code);
			dependencies.push(...resolvedValue.dependencies);
			imports.push(...resolvedValue.imports);
		});

		return { code: code.join(' & '), dependencies, imports };
	}

	const props = createObjectProperties(item, originalRef);

	return {
		code: liquid.renderSync(OBJECT_TEMPLATE, { props }),
		imports: uniq(props.flatMap((p) => p.imports)),
		dependencies: uniq(props.flatMap((p) => p.dependencies)),
	};
}

export function createFreeFormProperty(valueType?: ICodeWithMetadata): IObjectProps {
	return {
		key: '[key: string]',
		value: valueType?.code || 'any',
		dependencies: valueType?.dependencies || [],
		imports: valueType?.imports || [],
	};
}

export function resolveValue(
	schema: SchemaObject | ReferenceObject,
	originalRef: string,
): ICodeWithMetadata {
	return isReferenceObject(schema)
		? createReferenceNode(schema.$ref, originalRef)
		: createScalarNode(schema, originalRef);
}

export function createArray(item: SchemaObject, originalRef: string): ICodeWithMetadata {
	if (item.items) {
		const value = resolveValue(item.items, originalRef);
		return { ...value, code: value.code.match(/\W/) ? `Array<${value.code}>` : `${value.code}[]` };
	} else {
		throw new Error('All arrays must have an `items` key define');
	}
}

export function createScalarNode(item: SchemaObject, originalRef: string): ICodeWithMetadata {
	const type: ICodeWithMetadata = { code: 'unknown', dependencies: [], imports: [] };

	switch (item.type) {
		case 'number':
		case 'integer':
			type.code = 'number';
			break;
		case 'boolean':
			type.code = 'boolean';
			break;
		case 'array': {
			Object.assign(type, createArray(item, originalRef));
			break;
		}
		case 'string':
			type.code = item.enum
				? item.enum
						.sort()
						.map((name: string) => JSON.stringify(name))
						.join(' | ')
				: 'string';
			break;
		case 'object':
		default: {
			Object.assign(type, createObject(item, originalRef));
		}
	}

	if (item.nullable) {
		type.code = `${type.code} | null`;
	}

	return type;
}

export function createInterface(
	name: string,
	originalRef: string,
	schema: SchemaObject,
	extensions: ReferenceObject[] = [],
): ICodeWithMetadata {
	const props = createObjectProperties(schema, originalRef);
	const comments = liquid.renderSync(COMMENTS_TEMPLATE, { schema });
	const objectStructure = liquid.renderSync(OBJECT_TEMPLATE, { props });
	const imports = props.reduce<string[]>((p, c) => [...p, ...c.imports], []);
	const dependencies = props.reduce<string[]>((p, c) => [...p, ...c.dependencies], []);
	const foo = extensions.map((ext) => {
		const refNode = createReferenceNode(ext.$ref, originalRef);

		imports.push(...refNode.imports);
		dependencies.push(...refNode.dependencies);

		return refNode.code;
	});

	const extendsCode = foo.length > 0 ? ` extends ${foo.join(', ')}` : '';

	return {
		code: `${comments}\nexport interface ${name}${extendsCode} ${objectStructure}`,
		imports,
		dependencies,
	};
}

export function createTypeDeclaration(
	name: string,
	originalRef: string,
	schema: SchemaObject | ReferenceObject,
): ICodeWithMetadata {
	const resolvedValue = resolveValue(schema, originalRef);
	const comments = liquid.renderSync(COMMENTS_TEMPLATE, { schema });

	return {
		code: `${comments}\nexport type ${name} = ${resolvedValue.code};`,
		imports: resolvedValue.imports,
		dependencies: resolvedValue.dependencies,
	};
}

export function getRequestResponseSchema(
	schema: RequestBodyObject | ReferenceObject | ResponseObject,
): ReferenceObject | SchemaObject | undefined {
	if (isReferenceObject(schema)) {
		return schema;
	}

	if (schema.content) {
		const content = Object.entries(schema.content).find(
			([mediaType, contentObj]) =>
				mediaType.startsWith('*/*') ||
				mediaType.startsWith('application/json') ||
				(mediaType.startsWith('application/octet-stream') && contentObj.schema),
		);

		return content?.[1].schema;
	}
}

export function createRequestBodyDefinitions(
	schemas: ComponentsObject['requestBodies'] = {},
): Record<string, ICodeOutput> {
	const ret: Record<string, ICodeOutput> = {};
	const data = Object.entries(schemas);

	data.forEach(([name, schema]) => {
		const refPath = `#/components/requestBodies/${name}`;
		const finalName = getNameForRequestBody(name);
		let code = '';
		const dependencies: string[] = [];

		const response = getRequestResponseSchema(schema);

		if (!response) {
			return;
		}

		if (shouldCreateInterface(response)) {
			const interfaceCode = Array.isArray(response.allOf)
				? createInterface(finalName, refPath, ...processAllOf(response))
				: createInterface(finalName, refPath, response);
			code = liquid.renderSync(CODE_WITH_IMPORTS_TEMPLATE, interfaceCode);
			dependencies.push(...interfaceCode.dependencies);
		} else {
			const typeCode = createTypeDeclaration(finalName, refPath, response);
			code = liquid.renderSync(CODE_WITH_IMPORTS_TEMPLATE, typeCode);
			dependencies.push(...typeCode.dependencies);
		}

		ret[refPath] = {
			code,
			filepath: `requestBodies/${finalName}.ts`,
			ref: refPath,
			jsExports: [],
			typeExports: [finalName],
			dependencies,
		};
	});

	return ret;
}

export function createSchemaDefinitions(
	schemas: ComponentsObject['schemas'] = {},
	filter: string[] = [],
): Record<string, ICodeOutput> {
	const data = Object.entries(schemas);
	const ret: Record<string, ICodeOutput> = {};

	data.forEach(([name, schema]) => {
		const refPath = `#/components/schemas/${name}`;
		const finalName = getNameForType(name);
		let code = '';
		const dependencies: string[] = [];

		if (filter.length > 0 && !filter.includes(refPath)) {
			return;
		}

		if (shouldCreateInterface(schema)) {
			const interfaceCode = Array.isArray(schema.allOf)
				? createInterface(finalName, refPath, ...processAllOf(schema))
				: createInterface(finalName, refPath, schema);
			code = liquid.renderSync(CODE_WITH_IMPORTS_TEMPLATE, interfaceCode);
			dependencies.push(...interfaceCode.dependencies);
		} else {
			const typeCode = createTypeDeclaration(finalName, refPath, schema);
			code = liquid.renderSync(CODE_WITH_IMPORTS_TEMPLATE, typeCode);
			dependencies.push(...typeCode.dependencies);
		}

		ret[refPath] = {
			code,
			filepath: `schemas/${finalName}.ts`,
			ref: refPath,
			jsExports: [],
			typeExports: [finalName],
			dependencies,
		};
	});

	return ret;
}

export function createResponseDefinitions(
	schemas: ComponentsObject['responses'] = {},
): Record<string, ICodeOutput> {
	const ret: Record<string, ICodeOutput> = {};
	const data = Object.entries(schemas);

	data.forEach(([name, schema]) => {
		const refPath = `#/components/responses/${name}`;
		const finalName = getNameForResponse(name);
		const responseSchema = getRequestResponseSchema(schema);
		let code = '';
		const dependencies: string[] = [];

		if (!responseSchema) {
			code = `export type ${finalName} = unknown`;
			return;
		}

		if (shouldCreateInterface(responseSchema)) {
			const interfaceCode = Array.isArray(responseSchema.allOf)
				? createInterface(finalName, refPath, ...processAllOf(responseSchema))
				: createInterface(finalName, refPath, responseSchema);
			code = liquid.renderSync(CODE_WITH_IMPORTS_TEMPLATE, interfaceCode);
			dependencies.push(...interfaceCode.dependencies);
		} else {
			const typeCode = createTypeDeclaration(finalName, refPath, responseSchema);
			code = liquid.renderSync(CODE_WITH_IMPORTS_TEMPLATE, typeCode);
			dependencies.push(...typeCode.dependencies);
		}

		ret[refPath] = {
			code,
			filepath: `responses/${finalName}.ts`,
			ref: refPath,
			jsExports: [],
			typeExports: [finalName],
			dependencies,
		};
	});

	return ret;
}

export function getReqResTypes(
	responsesOrRequests: Array<[string, ResponseObject | ReferenceObject | RequestBodyObject]>,
	originalRef: string,
): ICodeWithMetadata {
	const dependencies: string[] = [];
	const imports: string[] = [];

	const codes = responsesOrRequests.map(([_, reqOrRes]): string => {
		if (!reqOrRes) {
			return 'unknown';
		}

		const responseSchema = getRequestResponseSchema(reqOrRes);

		if (responseSchema) {
			const resolvedValue = resolveValue(responseSchema, originalRef);

			dependencies.push(...resolvedValue.dependencies);
			imports.push(...resolvedValue.imports);

			return resolvedValue.code;
		}

		return 'unknown';
	});

	return { code: uniq(codes).join(' | ') || 'unknown', imports, dependencies };
}

export function getOkResponses(responses: ResponsesObject, originalRef: string): ICodeWithMetadata {
	const okResponses = Object.entries(responses).filter(([key]) => key.startsWith('2'));
	return getReqResTypes(okResponses, originalRef);
}

export function getErrorResponses(
	responses: ResponsesObject,
	originalRef: string,
): ICodeWithMetadata {
	const errorResponses = Object.entries(responses).filter(
		([key]) =>
			key.startsWith('3') || key.startsWith('4') || key.startsWith('5') || key === 'default',
	);
	return getReqResTypes(errorResponses, originalRef);
}
