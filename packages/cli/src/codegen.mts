import type {
	ReferenceObject,
	SchemaObject,
	ComponentsObject,
	RequestBodyObject,
	ResponseObject,
	ResponsesObject,
} from 'openapi3-ts';
import { Liquid } from 'liquidjs';
import { has, isPlainObject, isEmpty, uniq } from 'lodash-es';

import type { PluginReturn, CodeOutput } from './plugin.mjs';
import {
	getNameForType,
	getNameForResponse,
	getNameForRequestBody,
	getNameForParameter,
} from './nameHelpers.mjs';
import { isReferenceObject } from './helpers.mjs';

export interface CodeWithImports {
	code: string;
	imports: Set<string>;
}

export interface ObjectProps {
	key: string;
	value: string;
	comment?: string;
	required?: boolean;
}

export interface ParamsReturn {
	code: string;
	name: string;
	imports: Set<string>;
}

export type TemplateName =
	| 'object'
	| 'typeDeclaration'
	| 'interface'
	| 'comments'
	| 'codeWithImports';

export type TemplateProps<T> = T extends 'comments'
	? { schema?: SchemaObject | ReferenceObject }
	: T extends 'object'
	? { props: ObjectProps[] }
	: T extends 'interface'
	? { name: string; props: ObjectProps[]; schema: SchemaObject }
	: T extends 'typeDeclaration'
	? { name: string; value: string; schema: SchemaObject | ReferenceObject }
	: T extends 'codeWithImports'
	? CodeWithImports
	: object;

export interface RenderTemplate {
	<T extends TemplateName>(name: TemplateName, data?: TemplateProps<T>): string;
}

export class Codegen {
	private liquidEngine: Liquid;

	constructor(templateDirs: string[]) {
		this.liquidEngine = new Liquid({
			cache: true,
			root: templateDirs,
		});

		this.liquidEngine.registerFilter('js_comment', (val: string, indent = 2) =>
			val
				.split('\n')
				.map((c) => `* ${c}`.padStart(indent + c.length + 2, ''))
				.join('\n'),
		);

		this.liquidEngine.registerFilter('path_to_template', (val: string) => val.replace(/\{/g, '${'));
		this.liquidEngine.registerFilter('name_type', getNameForType);
		this.liquidEngine.registerFilter('name_response', getNameForResponse);
		this.liquidEngine.registerFilter('name_request_body', getNameForRequestBody);
		this.liquidEngine.registerFilter('name_parameter', getNameForParameter);
	}

	renderTemplate: RenderTemplate = (name, data): string => {
		return this.liquidEngine.renderFileSync(name + '.liquid', data);
	};

	createObjectProperties(item: SchemaObject, $imports: Set<string>): ObjectProps[] {
		if (!item.type && !has(item, 'properties') && !has(item, 'additionalProperties')) {
			return [];
		}

		if (item.type === 'object' && !has(item, 'properties')) {
			if (
				!has(item, 'additionalProperties') ||
				(isPlainObject(item.additionalProperties) && isEmpty(item.additionalProperties)) ||
				item.additionalProperties === true
			) {
				return [this.createFreeFormProperty()];
			}

			if (item.additionalProperties === false) {
				return [];
			}

			if (item.additionalProperties) {
				return [
					this.createFreeFormProperty(this.resolveValue(item.additionalProperties, $imports)),
				];
			}
		}

		if (item.properties) {
			const props = Object.keys(item.properties)
				.sort()
				.map((name): ObjectProps => {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const schema = item.properties![name];

					return {
						key: name,
						value: this.resolveValue(schema, $imports),
						comment: this.renderTemplate('comments', { schema }),
						required: item.required?.includes(name),
					};
				});

			if (item.additionalProperties) {
				props.push(
					this.createFreeFormProperty(
						item.additionalProperties === true
							? undefined
							: this.resolveValue(item.additionalProperties, $imports),
					),
				);
			}

			return props;
		}

		return [];
	}

	createObject(item: SchemaObject, $imports: Set<string>): string {
		if (isReferenceObject(item)) {
			return this.createReferenceNode(item.$ref, $imports);
		}

		if (Array.isArray(item.allOf)) {
			return item.allOf.map((entry) => this.resolveValue(entry, $imports)).join(' | ');
		}

		if (Array.isArray(item.oneOf)) {
			return item.oneOf.map((entry) => this.resolveValue(entry, $imports)).join(' & ');
		}

		const props = this.createObjectProperties(item, $imports);

		return this.renderTemplate('object', { props });
	}

	createFreeFormProperty(valueType = 'any'): ObjectProps {
		return { key: '[key: string]', value: valueType };
	}

	resolveValue(schema: SchemaObject | ReferenceObject, $imports: Set<string>): string {
		return isReferenceObject(schema)
			? this.createReferenceNode(schema.$ref, $imports)
			: this.createScalarNode(schema, $imports);
	}

	createArray(item: SchemaObject, imports: Set<string>): string {
		if (item.items) {
			const value = this.resolveValue(item.items, imports);
			return value.match(/\W/) ? `Array<${value}>` : `${value}[]`;
		} else {
			throw new Error('All arrays must have an `items` key define');
		}
	}

	createReferenceNode(ref: string, $imports: Set<string>): string {
		let type = '';

		if (ref.startsWith('#/components/schemas')) {
			type = getNameForType(ref.replace('#/components/schemas/', ''));
			$imports.add(`import type { ${type} } from '../schemas/${type}'`);
		} else if (ref.startsWith('#/components/responses')) {
			type = getNameForResponse(ref.replace('#/components/responses/', ''));
			$imports.add(`import type { ${type} } from '../responses/${type}'`);
		} else if (ref.startsWith('#/components/parameters')) {
			type = getNameForParameter(ref.replace('#/components/parameters/', ''));
			$imports.add(`import type { ${type} } from '../parameters/${type}'`);
		} else if (ref.startsWith('#/components/requestBodies')) {
			type = getNameForRequestBody(ref.replace('#/components/requestBodies/', ''));
			$imports.add(`import type { ${type} } from '../requestBodies/${type}'`);
		} else {
			throw new Error(
				'This library only resolve $ref that are include into `#/components/*` for now',
			);
		}

		return type;
	}

	createScalarNode(item: SchemaObject, $imports: Set<string>): string {
		let type = 'unknown';

		switch (item.type) {
			case 'number':
			case 'integer':
				type = 'number';
				break;
			case 'boolean':
				type = 'boolean';
				break;
			case 'array': {
				type = this.createArray(item, $imports);
				break;
			}
			case 'string':
				type = item.enum
					? item.enum
							.sort()
							.map((name: string) => JSON.stringify(name))
							.join(' | ')
					: 'string';
				break;
			case 'object':
			default: {
				type = this.createObject(item, $imports);
			}
		}

		if (item.nullable) {
			type = `${type} | null`;
		}

		return type;
	}

	createInterface(name: string, schema: SchemaObject): CodeWithImports {
		const imports = new Set<string>();
		const props = this.createObjectProperties(schema, imports);

		return {
			imports,
			code: this.renderTemplate('interface', { name, props, schema }),
		};
	}

	createTypeDeclaration(name: string, schema: SchemaObject | ReferenceObject): CodeWithImports {
		const imports = new Set<string>();
		const value = this.resolveValue(schema, imports);

		return {
			imports,
			code: this.renderTemplate('typeDeclaration', { name, value, schema }),
		};
	}

	getRequestResponseSchema(
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

	createRequestBodyDefinitions(schemas: ComponentsObject['requestBodies'] = {}): PluginReturn {
		const files: CodeOutput[] = [];
		const includes: string[] = [];
		const data = Object.entries(schemas);

		data.forEach(([name, schema]) => {
			const finalName = getNameForRequestBody(name);
			let code = '';

			const response = this.getRequestResponseSchema(schema);

			if (!response) {
				return;
			}

			if (
				!isReferenceObject(response) &&
				(!response.type || response.type === 'object') &&
				!response.allOf &&
				!response.oneOf &&
				!response.nullable
			) {
				code = this.renderTemplate('codeWithImports', this.createInterface(finalName, response));
			} else {
				code = this.renderTemplate(
					'codeWithImports',
					this.createTypeDeclaration(finalName, response),
				);
			}

			files.push({ code, file: `requestBodies/${finalName}.ts` });
			includes.push(`export { ${finalName} } from './requestBodies/${finalName}';`);
		});

		return { files, indexInclude: includes.join('\n') };
	}

	createSchemaDefinitions(schemas: ComponentsObject['schemas'] = {}): PluginReturn {
		const files: CodeOutput[] = [];
		const includes: string[] = [];
		const data = Object.entries(schemas);

		data.forEach(([name, schema]) => {
			const finalName = getNameForType(name);
			let code = '';

			if (
				!isReferenceObject(schema) &&
				(!schema.type || schema.type === 'object') &&
				!schema.allOf &&
				!schema.oneOf &&
				!schema.nullable
			) {
				code = this.renderTemplate('codeWithImports', this.createInterface(finalName, schema));
			} else {
				code = this.renderTemplate(
					'codeWithImports',
					this.createTypeDeclaration(finalName, schema),
				);
			}

			files.push({ code, file: `schemas/${finalName}.ts` });
			includes.push(`export { ${finalName} } from './schemas/${finalName}';`);
		});

		return { files, indexInclude: includes.join('\n') };
	}

	getReqResTypes(
		responsesOrRequests: Array<[string, ResponseObject | ReferenceObject | RequestBodyObject]>,
	): CodeWithImports {
		const imports = new Set<string>();
		const codes = responsesOrRequests.map(([_, reqOrRes]): string => {
			if (!reqOrRes) {
				return 'unknown';
			}

			const responseSchema = this.getRequestResponseSchema(reqOrRes);

			if (responseSchema) {
				return this.resolveValue(responseSchema, imports);
			}

			return 'unknown';
		});

		return { code: uniq(codes).join(' | ') || 'unknown', imports };
	}

	getOkResponses(responses: ResponsesObject): CodeWithImports {
		const okResponses = Object.entries(responses).filter(([key]) => key.startsWith('2'));
		return this.getReqResTypes(okResponses);
	}

	getErrorResponses(responses: ResponsesObject): CodeWithImports {
		const errorResponses = Object.entries(responses).filter(
			([key]) =>
				key.startsWith('3') || key.startsWith('4') || key.startsWith('5') || key === 'default',
		);
		return this.getReqResTypes(errorResponses);
	}
}
