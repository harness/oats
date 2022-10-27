import type {
	OpenAPIObject,
	OperationObject,
	ParameterLocation,
	ParameterObject,
} from 'openapi3-ts';
import { camelCase } from 'change-case';
import type { PluginReturn, CodeOutput, Plugin, PluginExports } from '@harnessio/oats-cli/plugin';
import { processPaths } from '@harnessio/oats-cli/pathHelpers';
import type { Codegen, ObjectProps } from '@harnessio/oats-cli/codegen';
import type { Config } from './config.mjs';
import {
	getNameForErrorResponse,
	getNameForRequestBody,
	getNameForOkResponse,
	getNameForType,
} from '@harnessio/oats-cli/nameHelpers';

const METHODS_WITH_BODY = ['post', 'put', 'patch'];

export interface ParamsCode {
	name: string;
	props: ObjectProps[];
}

export type ReactQueryTemplateName =
	| 'useQueryHook'
	| 'useMutationHook'
	| 'defaultFetcher'
	| 'reactQueryCommon';
export interface ReactQueryTemplateProps {
	hookName: string;
	fetcherPropsName: string;
	requestBodyName: string;
	fetcherName: string;
	requestBodyCode: string | null;
	okResponseName: string;
	errorResponseName: string;
	okResponseCode: string;
	errorResponseCode: string;
	route: string;
	verb: string;
	operation: OperationObject;
	params: Record<ParameterLocation, ParameterObject[]>;
	pathParams: ParamsCode;
	queryParams: ParamsCode;
}

declare module '@harnessio/oats-cli/codegen' {
	export interface RenderTemplate {
		(name: ReactQueryTemplateName, data?: ReactQueryTemplateProps): string;
	}
}

export function generateReactQueryHooks(config?: Config): Plugin['generate'] {
	return async (spec: OpenAPIObject, codegen: Codegen): Promise<PluginReturn> => {
		const files: CodeOutput[] = [];
		const indexIncludes: Record<string, PluginExports> = {};

		processPaths(spec, (route, verb, operation, params) => {
			// check for operationId
			if (!operation.operationId) {
				throw new Error(
					`Every path must have a operationId - No operationId set for ${verb} ${route}`,
				);
			}

			const useUseQuery = verb === 'get' || config?.overrides?.[operation.operationId]?.useQuery;
			const suffix = useUseQuery ? 'Query' : 'Mutation';

			let imports = new Set<string>();
			const typeName = getNameForType(operation.operationId);
			const hookName = `use${typeName}${suffix}`;
			const fetcherName = `${camelCase(operation.operationId)}`;
			const fetcherPropsName = `${typeName}Props`;
			const requestBodyName = getNameForRequestBody(operation.operationId);
			const okResponseName = getNameForOkResponse(operation.operationId);
			const errorResponseName = getNameForErrorResponse(operation.operationId);
			const okResponseCode = codegen.getOkResponses(operation.responses);
			const errorResponseCode = codegen.getErrorResponses(operation.responses);
			let requestBodyCode: string | null = null;

			okResponseCode.imports.forEach((imp) => imports.add(imp));
			errorResponseCode.imports.forEach((imp) => imports.add(imp));

			if (METHODS_WITH_BODY.includes(verb) && operation.requestBody) {
				const bodyCode = codegen.getReqResTypes([['body', operation.requestBody]]);

				requestBodyCode = bodyCode.code;
				bodyCode.imports.forEach((imp) => imports.add(imp));
			}

			const pathParams = {
				name: `Use${typeName}${suffix}PathParams`,
				props: params.path.map(
					(param): ObjectProps => ({
						key: param.name,
						value: param.schema ? codegen.resolveValue(param.schema, imports) : 'unknown',
						comment: codegen.renderTemplate('comments', { schema: param.schema }),
						required: true,
					}),
				),
			};

			const queryParams = {
				name: `Use${typeName}${suffix}QueryParams`,
				props: params.query.map(
					(param): ObjectProps => ({
						key: param.name,
						value: param.schema ? codegen.resolveValue(param.schema, imports) : 'unknown',
						comment: codegen.renderTemplate('comments', { schema: param.schema }),
						required: !!param.required,
					}),
				),
			};

			const templateProps: ReactQueryTemplateProps = {
				hookName,
				fetcherPropsName,
				fetcherName,
				requestBodyName,
				requestBodyCode,
				okResponseCode: okResponseCode.code,
				okResponseName,
				errorResponseCode: errorResponseCode.code,
				errorResponseName,
				route,
				verb,
				operation,
				params,
				pathParams,
				queryParams,
			};

			const code = [
				codegen.renderTemplate('reactQueryCommon', templateProps).trim(),
				codegen
					.renderTemplate(useUseQuery ? 'useQueryHook' : 'useMutationHook', templateProps)
					.trim(),
			].join('\n');

			const exportedTypes = [fetcherPropsName, okResponseName, errorResponseName];

			if (pathParams.props.length > 0) {
				exportedTypes.push(pathParams.name);
			}

			if (queryParams.props.length > 0) {
				exportedTypes.push(queryParams.name);
			}

			if (requestBodyCode) {
				exportedTypes.push(requestBodyName);
			}

			indexIncludes[`./hooks/${hookName}`] = { exports: [hookName, fetcherName], types: [] };

			if (exportedTypes.length > 0) {
				indexIncludes[`./hooks/${hookName}`].types.push(...exportedTypes);
			}

			if (useUseQuery) {
				imports = new Set([
					'import { useQuery, UseQueryOptions } from "@tanstack/react-query";',
					'',
					...imports,
				]);
			} else {
				imports = new Set([
					'import { useMutation, UseMutationOptions } from "@tanstack/react-query";',
					'',
					...imports,
				]);
			}

			if (!config?.customFetcher) {
				files.push({ code: codegen.renderTemplate('defaultFetcher'), file: 'hooks/fetcher.ts' });
			}

			imports.add(
				`import { fetcher, FetcherOptions } from "${config?.customFetcher || './fetcher'}";`,
			);

			files.push({
				code: codegen.renderTemplate('codeWithImports', {
					imports,
					code,
				}),
				file: `hooks/${hookName}.ts`,
			});
		});

		return { files, indexIncludes };
	};
}
