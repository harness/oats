import type { OpenAPIV3 } from 'openapi-types';
import { has, isPlainObject, isEmpty, uniq, partition, merge, get } from 'lodash-es';
import { Liquid } from 'liquidjs';

import type { ICodeOutput } from './plugin.mjs';
import {
	getNameForType,
	getNameForRequestBody,
	getNameForResponse,
	getNameForParameter,
} from './nameHelpers.mjs';
import { isReferenceObject, _readTemplate } from './helpers.mjs';

type IReferenceObject = OpenAPIV3.ReferenceObject;
type ISchemaObject = OpenAPIV3.SchemaObject;
type IArraySchemaObject = OpenAPIV3.ArraySchemaObject;
type IRequestBodyObject = OpenAPIV3.RequestBodyObject;
type IResponseObject = OpenAPIV3.ResponseObject;
type IComponentsObject = OpenAPIV3.ComponentsObject;
type IResponsesObject = OpenAPIV3.ResponsesObject;

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
	hasDiscriminator?: boolean;
}

export const liquid = new Liquid();

liquid.registerFilter('js_comment', (val: string, indent = 2) =>
	val
		.split('\n')
		.map((c) => `* ${c.replace(/\*\//g, '*\u200b/')}`.padStart(indent + c.length + 2, ''))
		.join('\n'),
);

export const OBJECT_TEMPLATE = liquid.parse(_readTemplate('object.liquid'));
export const COMMENTS_TEMPLATE = liquid.parse(_readTemplate('comments.liquid'));
export const CODE_WITH_IMPORTS_TEMPLATE = liquid.parse(_readTemplate('codeWithImports.liquid'));
export const INTERFACE_TEMPLATE = liquid.parse(_readTemplate('interface.liquid'));

export function shouldCreateInterface(
	schema: ISchemaObject | IReferenceObject,
): schema is ISchemaObject {
	return (
		!isReferenceObject(schema) &&
		(!schema.type || schema.type === 'object') &&
		!schema.oneOf &&
		!schema.nullable
	);
}

export function hasDiscriminator(
	schema?: ISchemaObject | IReferenceObject,
	components?: IComponentsObject,
): boolean {
	if (!schema) {
		return false;
	}

	if (isReferenceObject(schema)) {
		const path = schema.$ref.split('/');
		path.shift();

		const resolvedSchema = get({ components }, path);

		return hasDiscriminator(resolvedSchema, components);
	}

	return !!(schema.discriminator?.propertyName && schema.discriminator.mapping);
}

export interface IProcessAllOfReturn {
	schema: ISchemaObject;
	extensions: IReferenceObject[];
}

export function processAllOf(schema: ISchemaObject): IProcessAllOfReturn {
	if (Array.isArray(schema.allOf)) {
		const [allRefs, allSchemas] = partition(schema.allOf, (s) => isReferenceObject(s)) as [
			IReferenceObject[],
			ISchemaObject[],
		];
		const mergedSchema = allSchemas.reduce((p, c) => merge(p, c), {} as ISchemaObject);

		return { schema: mergedSchema, extensions: allRefs };
	}

	return { schema, extensions: [] };
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

export function createObjectProperties(
	item: ISchemaObject,
	originalRef: string,
	components: IComponentsObject = {},
): IObjectProps[] {
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
					imports: uniq(resolvedValue.imports),
					hasDiscriminator: hasDiscriminator(schema, components),
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

export function createObject(
	item: ISchemaObject,
	originalRef: string,
	components: IComponentsObject = {},
): ICodeWithMetadata {
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

		return { code: code.join(' | '), dependencies, imports: uniq(imports) };
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

		return { code: code.join(' & '), dependencies, imports: uniq(imports) };
	}

	const props = createObjectProperties(item, originalRef, components);

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
		imports: uniq(valueType?.imports || []),
	};
}

export function resolveValue(
	schema: ISchemaObject | IReferenceObject,
	originalRef: string,
): ICodeWithMetadata {
	return isReferenceObject(schema)
		? createReferenceNode(schema.$ref, originalRef)
		: createScalarNode(schema, originalRef);
}

export function createArray(item: IArraySchemaObject, originalRef: string): ICodeWithMetadata {
	if (item.items) {
		const value = resolveValue(item.items, originalRef);
		return { ...value, code: value.code.match(/\W/) ? `Array<${value.code}>` : `${value.code}[]` };
	} else {
		throw new Error('All arrays must have an `items` key define');
	}
}

export function createScalarNode(item: ISchemaObject, originalRef: string): ICodeWithMetadata {
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

	type.imports = uniq(type.imports);

	return type;
}

export interface ICreateInterfaceProps {
	name: string;
	originalRef: string;
	schema: ISchemaObject;
	components: IComponentsObject;
}

export function createInterface(props: ICreateInterfaceProps): ICodeWithMetadata {
	const { name, originalRef, schema: originalSchema, components } = props;
	const { schema, extensions } = processAllOf(originalSchema);
	const generics: string[] = [];
	let i = 0;

	const objProps = createObjectProperties(schema, originalRef, components).map((obj) => {
		let value = obj.value;

		if (obj.hasDiscriminator) {
			value = `T${i++}`;
			generics.push(`${value} extends ${obj.value} = ${obj.value}`);
		}

		return { ...obj, value };
	});

	const comments = liquid.renderSync(COMMENTS_TEMPLATE, { schema });
	const objectStructure = liquid.renderSync(OBJECT_TEMPLATE, { props: objProps });
	const imports = objProps.reduce<string[]>((p, c) => [...p, ...c.imports], []);
	const dependencies = objProps.reduce<string[]>((p, c) => [...p, ...c.dependencies], []);
	const resolvedExtensions = extensions.map((ext) => {
		const refNode = createReferenceNode(ext.$ref, originalRef);

		imports.push(...refNode.imports);
		dependencies.push(...refNode.dependencies);

		return refNode.code;
	});

	return {
		code: liquid.renderSync(INTERFACE_TEMPLATE, {
			resolvedExtensions,
			name,
			objectStructure,
			comments,
			generics,
		}),
		imports: uniq(imports),
		dependencies,
	};
}

export function createTypeDeclaration(
	name: string,
	originalRef: string,
	schema: ISchemaObject | IReferenceObject,
): ICodeWithMetadata {
	const resolvedValue = resolveValue(schema, originalRef);
	const comments = liquid.renderSync(COMMENTS_TEMPLATE, { schema });

	return {
		code: `${comments}\nexport type ${name} = ${resolvedValue.code};`,
		imports: uniq(resolvedValue.imports),
		dependencies: resolvedValue.dependencies,
	};
}

export function getRequestResponseSchema(
	schema: IRequestBodyObject | IReferenceObject | IResponseObject,
): IReferenceObject | ISchemaObject | undefined {
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
	components: IComponentsObject = {},
): Record<string, ICodeOutput> {
	const ret: Record<string, ICodeOutput> = {};
	const schemas = components.requestBodies || {};
	const data = Object.entries(schemas);

	data.forEach(([name, schema]) => {
		const refPath = `#/components/requestBodies/${name}`;
		const finalName = getNameForRequestBody(name);
		let code = '';
		const dependencies: string[] = [];

		const response = getRequestResponseSchema(schema);

		if (!response) {
			code = `export type ${finalName} = unknown`;
		} else if (shouldCreateInterface(response)) {
			const interfaceCode = createInterface({
				name: finalName,
				originalRef: refPath,
				components,
				schema: response,
			});
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
	components: IComponentsObject = {},
	filter: string[] = [],
): Record<string, ICodeOutput> {
	const schemas = components.schemas || {};
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
			const interfaceCode = createInterface({
				name: finalName,
				originalRef: refPath,
				components,
				schema,
			});
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
	components: IComponentsObject = {},
): Record<string, ICodeOutput> {
	const schemas = components.responses || {};
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
		} else if (shouldCreateInterface(responseSchema)) {
			const interfaceCode = createInterface({
				name: finalName,
				originalRef: refPath,
				components,
				schema: responseSchema,
			});
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
	responsesOrRequests: Array<[string, IResponseObject | IReferenceObject | IRequestBodyObject]>,
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

	return { code: uniq(codes).join(' | ') || 'unknown', imports: uniq(imports), dependencies };
}

export function getOkResponses(
	responses: IResponsesObject,
	originalRef: string,
): ICodeWithMetadata {
	const okResponses = Object.entries(responses).filter(([key]) => key.startsWith('2'));
	return getReqResTypes(okResponses, originalRef);
}

export function getErrorResponses(
	responses: IResponsesObject,
	originalRef: string,
): ICodeWithMetadata {
	const errorResponses = Object.entries(responses).filter(
		([key]) =>
			key.startsWith('3') || key.startsWith('4') || key.startsWith('5') || key === 'default',
	);
	return getReqResTypes(errorResponses, originalRef);
}
