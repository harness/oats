import { camelCase } from 'change-case';
import { groupByParamType, ICodeOutput } from '@harnessio/oats-cli';
import {
	getErrorResponses,
	getOkResponses,
	getReqResTypes,
	getNameForErrorResponse,
	getNameForRequestBody,
	getNameForOkResponse,
	getNameForType,
	CODE_WITH_IMPORTS_TEMPLATE,
	COMMENTS_TEMPLATE,
	OBJECT_TEMPLATE,
} from '@harnessio/oats-cli';

import { _readTemplate, liquid, METHODS_WITH_BODY, processParams } from './helpers.mjs';
import type { IOperation } from './processScopedOperations.mjs';
import type { IConfig } from './config.mjs';

const COMMON_TEMPLATE = liquid.parse(_readTemplate('reactQueryCommon.liquid'));
const QUERY_TEMPLATE = liquid.parse(_readTemplate('useQueryHook.liquid'));
const MUTATION_TEMPLATE = liquid.parse(_readTemplate('useMutationHook.liquid'));

processOperation;

export function processOperation(op: IOperation, config: IConfig): ICodeOutput {
	const { operation, method, params, path } = op;
	const useUseQuery = method === 'get' || config?.overrides?.[operation.operationId]?.useQuery;
	const suffix = useUseQuery ? 'Query' : 'Mutation';
	const dependencies: string[] = [];
	let imports = new Set<string>();
	const typeName = getNameForType(operation.operationId);
	const hookName = `use${typeName}${suffix}`;
	const fetcherName = `${camelCase(operation.operationId)}`;
	const fetcherPropsName = `${typeName}Props`;
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

	if (METHODS_WITH_BODY.includes(method) && operation.requestBody) {
		const bodyCode = getReqResTypes([['body', operation.requestBody]], '');

		requestBodyCode = bodyCode.code;
		bodyCode.imports.forEach((imp) => imports.add(imp));
		dependencies.push(...bodyCode.dependencies);
	}

	const groupedParams = groupByParamType(params);
	const pathParams = groupedParams.path.map(processParams);
	const queryParams = groupedParams.query.map(processParams);
	const headerParams = groupedParams.header.map(processParams);
	const pathParamsCode =
		pathParams.length > 0 ? liquid.renderSync(OBJECT_TEMPLATE, { props: pathParams }) : null;
	const queryParamsCode =
		queryParams.length > 0 ? liquid.renderSync(OBJECT_TEMPLATE, { props: queryParams }) : null;
	const headerParamsCode =
		headerParams.length > 0 ? liquid.renderSync(OBJECT_TEMPLATE, { props: headerParams }) : null;

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
		route: path,
		verb: method,
		operation,
		params,
		pathParamsName,
		pathParamsCode,
		queryParamsName,
		queryParamsCode,
		headerParamsName,
		headerParamsCode,
		pathParamsNamesList: groupedParams.path.map((p) => p.name),
		description: liquid.renderSync(COMMENTS_TEMPLATE, { schema: operation }).trimEnd(),
	};

	const code = [
		liquid.renderSync(COMMON_TEMPLATE, templateProps).trim(),
		liquid.renderSync(useUseQuery ? QUERY_TEMPLATE : MUTATION_TEMPLATE, templateProps).trim(),
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

	imports.add(`import type { ResponseWithPagination } from "../helpers";`);
	imports.add(`import { fetcher, FetcherOptions } from "${config?.customFetcher || './fetcher'}";`);

	return {
		code: liquid.renderSync(CODE_WITH_IMPORTS_TEMPLATE, {
			imports,
			code,
		}),
		filepath: `hooks/${hookName}.ts`,
		ref: '',
		dependencies,
		jsExports,
		typeExports,
	};
}
