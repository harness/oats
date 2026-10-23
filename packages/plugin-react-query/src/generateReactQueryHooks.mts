import type { OpenAPIV3 } from 'openapi-types';
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
	isEventStreamOperation,
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
const EVENT_STREAM_FETCHER_TEMPLATE = liquid.parse(_readTemplate('eventStreamFetcher.liquid'));
const EVENT_STREAM_COMMON_TEMPLATE = liquid.parse(_readTemplate('eventStreamCommon.liquid'));
const EVENT_STREAM_HOOK_TEMPLATE = liquid.parse(_readTemplate('useEventStreamHook.liquid'));
const METHODS_WITH_BODY = ['post', 'put', 'patch'];

export interface IParamsCode {
	name: string;
	props: IObjectProps[];
}

function processParams(param: OpenAPIV3.ParameterObject): IObjectProps {
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
	return async (spec: OpenAPIV3.Document): Promise<IPluginReturn> => {
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

			// Server-Sent Events (SSE): a successful response declared as
			// `text/event-stream` gets a dedicated subscription hook instead
			// of a `useQuery`/`useMutation` hook.
			const isEventStream = isEventStreamOperation(operation.responses);
			const useUseQuery = verb === 'get' || config?.overrides?.[operation.operationId]?.useQuery;
			const suffix = isEventStream ? 'EventStream' : useUseQuery ? 'Query' : 'Mutation';
			const dependencies: string[] = [];
			let imports = new Set<string>();
			const typeName = getNameForType(operation.operationId);
			const hookName = `use${typeName}${suffix}`;
			const fetcherName = `${camelCase(operation.operationId)}`;
			const fetcherPropsName = `${typeName}Props`;
			const mutationPropsName = `${typeName}MutationProps`;
			const pathParamsName = `${typeName}${suffix}PathParams`;
			const queryParamsName = `${typeName}${suffix}QueryParams`;
			const headerParamsName = `${typeName}${suffix}HeaderParams`;
			const requestBodyName = getNameForRequestBody(operation.operationId);
			const okResponseName = getNameForOkResponse(operation.operationId);
			const errorResponseName = getNameForErrorResponse(operation.operationId);
			const okResponseCode = getOkResponses(operation.responses, '');
			const errorResponseCode = getErrorResponses(operation.responses, '');
			let requestBodyCode: string | null = null;

			okResponseCode.imports.forEach((imp) => imports.add(imp));
			errorResponseCode.imports.forEach((imp) => imports.add(imp));
			dependencies.push(...okResponseCode.dependencies, ...errorResponseCode.dependencies);

			if (!isEventStream && METHODS_WITH_BODY.includes(verb) && operation.requestBody) {
				const bodyCode = getReqResTypes([['body', operation.requestBody]], '');

				requestBodyCode = bodyCode.code;
				bodyCode.imports.forEach((imp) => imports.add(imp));
				dependencies.push(...bodyCode.dependencies);
			}

			const pathParams = params.path.map(processParams);
			const queryParams = params.query.map(processParams);
			const headerParams = params.header.map(processParams);
			const pathParamsCode =
				pathParams.length > 0 ? liquid.renderSync(OBJECT_TEMPLATE, { props: pathParams }) : null;
			const queryParamsCode =
				queryParams.length > 0 ? liquid.renderSync(OBJECT_TEMPLATE, { props: queryParams }) : null;
			const headerParamsCode =
				headerParams.length > 0
					? liquid.renderSync(OBJECT_TEMPLATE, { props: headerParams })
					: null;

			[...pathParams, ...queryParams, ...headerParams].forEach((param) => {
				param.imports.forEach((imp) => imports.add(imp));
				dependencies.push(...param.dependencies);
			});

			const templateProps = {
				hookName,
				fetcherPropsName,
				mutationPropsName,
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
				headerParamsName,
				headerParamsCode,
				pathParamsNamesList: params.path.map((p) => p.name),
				queryParamsNamesList: params.query.map((p) => p.name),
				headerParamsNamesList: params.header.map((p) => p.name),
				description: liquid.renderSync(COMMENTS_TEMPLATE, { schema: operation }).trimEnd(),
				typeName,
			};

			const code = isEventStream
				? [
						liquid.renderSync(EVENT_STREAM_COMMON_TEMPLATE, templateProps).trim(),
						liquid.renderSync(EVENT_STREAM_HOOK_TEMPLATE, templateProps).trim(),
					].join('\n\n')
				: [
						liquid.renderSync(COMMON_TEMPLATE, templateProps).trim(),
						liquid
							.renderSync(useUseQuery ? QUERY_TEMPLATE : MUTATION_TEMPLATE, templateProps)
							.trim(),
					].join('\n\n');

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

			if (isEventStream) {
				typeExports.push(
					`${typeName}EventStreamStatus`,
					`${typeName}EventStreamState`,
					`${typeName}EventStreamOptions`,
				);
				imports = new Set([
					'import { useEffect, useRef, useState } from "react";',
					'import { useQueryClient, QueryKey } from "@tanstack/react-query";',
					'',
					...imports,
				]);
			} else if (useUseQuery) {
				imports = new Set([
					'import { useQuery, UseQueryOptions } from "@tanstack/react-query";',
					'',
					...imports,
				]);
			} else {
				typeExports.push(mutationPropsName);
				imports = new Set([
					'import { useMutation, UseMutationOptions } from "@tanstack/react-query";',
					'',
					...imports,
				]);
			}

			if (isEventStream) {
				if (!config?.customEventStreamFetcher) {
					files.push({
						code: liquid.renderSync(EVENT_STREAM_FETCHER_TEMPLATE),
						filepath: 'hooks/eventStreamFetcher.ts',
						ref: '',
						dependencies: [],
						jsExports: [],
						typeExports: [],
					});
				}

				imports.add(
					`import { subscribeToEventStream, EventStreamOptions, EventStreamHandlers } from "${
						config?.customEventStreamFetcher || './eventStreamFetcher'
					}";`,
				);
			} else {
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
			}

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
