import type { OpenAPIObject, ParameterObject } from 'openapi3-ts';
import { camelCase } from 'change-case';
import type { ICodeOutput, IObjectProps, IPlugin, IPluginReturn } from '@harnessio/oats-cli';
import {
	processPaths,
	getErrorResponses,
	getOkResponses,
	getReqResTypes,
	getNameForErrorResponse,
	getNameForRequestBody,
	getNameForOkResponse,
	getNameForType,
	resolveValue,
	CODE_WITH_IMPORTS_TEMPLATE,
	COMMENTS_TEMPLATE,
	OBJECT_TEMPLATE,
} from '@harnessio/oats-cli';

import type { IConfig } from './config.mjs';
import { Config } from './config.mjs';
import { _readTemplate, liquid } from './helpers.mjs';

const DEFAULT_FETCHER_TEMPLATE = liquid.parse(_readTemplate('defaultFetcher.liquid'));
const COMMON_TEMPLATE = liquid.parse(_readTemplate('reactQueryCommon.liquid'));
const QUERY_TEMPLATE = liquid.parse(_readTemplate('useQueryHook.liquid'));
const MUTATION_TEMPLATE = liquid.parse(_readTemplate('useMutationHook.liquid'));
const METHODS_WITH_BODY = ['post', 'put', 'patch'];

export interface IParamsCode {
	name: string;
	props: IObjectProps[];
}

function processParams(param: ParameterObject): IObjectProps {
	const resolvedValue = param.schema ? resolveValue(param.schema, '') : undefined;

	return {
		key: param.name,
		value: resolvedValue?.code || 'unknown',
		comment: liquid.renderSync(COMMENTS_TEMPLATE, { schema: param.schema }),
		required: param.in === 'path' ? true : !!param.required,
		dependencies: resolvedValue?.dependencies || [],
		imports: resolvedValue?.imports || [],
	};
}

export function generateReactQueryHooks(config?: IConfig): IPlugin['generate'] {
	return async (spec: OpenAPIObject): Promise<IPluginReturn> => {
		// validate config
		await Config.parseAsync(config);

		const files: ICodeOutput[] = [];

		processPaths(spec, (route, verb, operation, params) => {
			// check for operationId
			if (!operation.operationId) {
				throw new Error(
					`Every path must have a operationId - No operationId set for ${verb} ${route}`,
				);
			}

			if (
				config &&
				Array.isArray(config.allowedOperationIds) &&
				// check for the operationId in the allow-list.
				!config.allowedOperationIds.includes(operation.operationId)
			) {
				return;
			}

			const useUseQuery = verb === 'get' || config?.overrides?.[operation.operationId]?.useQuery;
			const suffix = useUseQuery ? 'Query' : 'Mutation';
			const dependencies: string[] = [];
			let imports = new Set<string>();
			const typeName = getNameForType(operation.operationId);
			const hookName = `use${typeName}${suffix}`;
			const fetcherName = `${camelCase(operation.operationId)}`;
			const fetcherPropsName = `${typeName}Props`;
			const pathParamsName = `${typeName}${suffix}PathParams`;
			const queryParamsName = `${typeName}${suffix}QueryParams`;
			const requestBodyName = getNameForRequestBody(operation.operationId);
			const okResponseName = getNameForOkResponse(operation.operationId);
			const errorResponseName = getNameForErrorResponse(operation.operationId);
			const okResponseCode = getOkResponses(operation.responses, '');
			const errorResponseCode = getErrorResponses(operation.responses, '');
			let requestBodyCode: string | null = null;

			okResponseCode.imports.forEach((imp) => imports.add(imp));
			errorResponseCode.imports.forEach((imp) => imports.add(imp));
			dependencies.push(...okResponseCode.dependencies, ...errorResponseCode.dependencies);

			if (METHODS_WITH_BODY.includes(verb) && operation.requestBody) {
				const bodyCode = getReqResTypes([['body', operation.requestBody]], '');

				requestBodyCode = bodyCode.code;
				bodyCode.imports.forEach((imp) => imports.add(imp));
				dependencies.push(...bodyCode.dependencies);
			}

			const pathParams = params.path.map(processParams);
			const queryParams = params.query.map(processParams);
			const pathParamsCode =
				pathParams.length > 0 ? liquid.renderSync(OBJECT_TEMPLATE, { props: pathParams }) : null;
			const queryParamsCode =
				queryParams.length > 0 ? liquid.renderSync(OBJECT_TEMPLATE, { props: queryParams }) : null;

			const templateProps = {
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
				pathParamsName,
				pathParamsCode,
				queryParamsName,
				queryParamsCode,
				pathParamsNamesList: params.path.map((p) => p.name),
			};

			const code = [
				liquid.renderSync(COMMON_TEMPLATE, templateProps).trim(),
				liquid.renderSync(COMMENTS_TEMPLATE, { schema: operation }).trimEnd(),
				liquid.renderSync(useUseQuery ? QUERY_TEMPLATE : MUTATION_TEMPLATE, templateProps).trim(),
			].join('\n');

			const typeExports = [fetcherPropsName, okResponseName, errorResponseName];
			const jsExports = [hookName, fetcherName];

			if (pathParams.length > 0) {
				typeExports.push(pathParamsName);
			}

			if (queryParams.length > 0) {
				typeExports.push(queryParamsName);
			}

			if (requestBodyCode) {
				typeExports.push(requestBodyName);
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
				files.push({
					code: liquid.renderSync(DEFAULT_FETCHER_TEMPLATE),
					filepath: 'hooks/fetcher.ts',
					ref: '',
					dependencies: [],
					jsExports: [],
					typeExports: [],
				});
			}

			imports.add(
				`import { fetcher, FetcherOptions } from "${config?.customFetcher || './fetcher'}";`,
			);

			files.push({
				code: liquid.renderSync(CODE_WITH_IMPORTS_TEMPLATE, {
					imports,
					code,
				}),
				filepath: `hooks/${hookName}.ts`,
				ref: '',
				dependencies,
				jsExports,
				typeExports,
			});
		});

		return { files };
	};
}
