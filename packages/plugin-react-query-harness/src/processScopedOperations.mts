import type { OpenAPIV3 } from 'openapi-types';
import { camelCase } from 'change-case';
import type { ICodeOutput } from '@harnessio/oats-cli';
import {
	groupByParamType,
	getErrorResponses,
	getOkResponses,
	getReqResTypes,
	getNameForType,
	COMMENTS_TEMPLATE,
	CODE_WITH_IMPORTS_TEMPLATE,
	OBJECT_TEMPLATE,
} from '@harnessio/oats-cli';
import { _readTemplate, liquid, METHODS_WITH_BODY, processParams } from './helpers.mjs';

const COMMON_GROUPED_FETCHER_TEMPLATE = liquid.parse(_readTemplate('commonGroupedFetcher.liquid'));
const GROUPED_QUERY_HOOK_TEMPLATE = liquid.parse(_readTemplate('groupedQueryHook.liquid'));
const GROUPED_MUTATION_HOOK_TEMPLATE = liquid.parse(_readTemplate('groupedMutationHook.liquid'));
const COMMON_GROUPED_TYPES_TEMPLATE = liquid.parse(_readTemplate('commonGroupedTypes.liquid'));

export interface IOperation {
	method: OpenAPIV3.HttpMethods;
	path: string;
	operation: Omit<OpenAPIV3.OperationObject, 'operationId'> & { operationId: string };
	params: OpenAPIV3.ParameterObject[];
}

export interface IProcessOperationProps {
	route: string;
	verb: string;
	operation: OpenAPIV3.OperationObject;
	params: OpenAPIV3.ParameterObject[];
	suffix: string;
	operationId: string;
}

export interface IProcessOperationReturn extends ICodeOutput {
	imports: Set<string>;
	okResponseName: string;
	errorResponseName: string;
	pathParamsName: string;
	pathParamsNamesList: string[];
}

export function processSingleGroupedOperation(
	props: IProcessOperationProps,
): IProcessOperationReturn {
	const { operationId, operation, params, suffix, verb, route } = props;

	const dependencies: string[] = [];
	const imports = new Set<string>();
	const typeName = getNameForType(operationId);
	const hookName = `use${typeName}${suffix}`;
	const fetcherName = `${camelCase(operationId)}`;
	const fetcherPropsName = `${typeName}Props`;
	const mutationPropsName = `${typeName}MutationProps`;
	const pathParamsName = `${typeName}${suffix}PathParams`;
	const queryParamsName = `${typeName}${suffix}QueryParams`;
	const headerParamsName = `${typeName}${suffix}HeaderParams`;
	const requestBodyName = `${typeName}${suffix}RequestBody`;
	const okResponseName = `${typeName}${suffix}OKResponse`;
	const errorResponseName = `${typeName}${suffix}ErrorResponse`;
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

	const groupedParams = groupByParamType(params);

	const pathParams = groupedParams.path.map(processParams);
	const queryParams = groupedParams.query.map(processParams);
	const headerParams = groupedParams.header.map(processParams);
	const pathParamsCode =
		pathParams.length > 0 ? liquid.renderSync(OBJECT_TEMPLATE, { props: pathParams }) : '{}';
	const queryParamsCode =
		queryParams.length > 0 ? liquid.renderSync(OBJECT_TEMPLATE, { props: queryParams }) : null;
	const headerParamsCode =
		headerParams.length > 0 ? liquid.renderSync(OBJECT_TEMPLATE, { props: headerParams }) : null;
	const pathParamsNamesList = groupedParams.path.map((p) => p.name);

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
		pathParamsNamesList,
		description: liquid.renderSync(COMMENTS_TEMPLATE, { schema: operation }).trimEnd(),
	};

	const code = liquid.renderSync(COMMON_GROUPED_TYPES_TEMPLATE, templateProps).trim();

	const typeExports = [fetcherPropsName, okResponseName, errorResponseName];

	if (pathParams.length > 0) {
		typeExports.push(pathParamsName);
	}

	if (queryParams.length > 0) {
		typeExports.push(queryParamsName);
	}

	if (requestBodyCode) {
		typeExports.push(requestBodyName);
	}

	return {
		code,
		filepath: ``,
		ref: '',
		dependencies,
		jsExports: [],
		typeExports,
		imports,
		okResponseName,
		errorResponseName,
		pathParamsName,
		pathParamsNamesList,
	};
}

export interface IProcessScopedOperationsProps {
	operationId: string;
	accountOperation?: IOperation;
	projectOperation?: IOperation;
	orgOperation?: IOperation;
	useMutation?: boolean;
	customFetcher?: string;
}

export function processScopedOperations(props: IProcessScopedOperationsProps): ICodeOutput {
	const {
		operationId,
		accountOperation,
		projectOperation,
		orgOperation,
		useMutation,
		customFetcher,
	} = props;
	let imports = new Set<string>();
	const dependencies: string[] = [];
	const jsExports: string[] = [];
	const typeExports: string[] = [];
	const queryOrMutation: 'Query' | 'Mutation' = useMutation ? 'Mutation' : 'Query';
	const typeName = getNameForType(operationId);
	const code: string[] = [];
	const hookName = `use${typeName}${queryOrMutation}`;
	const mutationPropsName = `${typeName}MutationProps`;
	const scopedParams: Record<string, any> = {};
	const pathParamsNamesList: string[] = [];

	if (accountOperation) {
		const accountOutput = processSingleGroupedOperation({
			route: accountOperation.path,
			operation: accountOperation.operation,
			operationId,
			verb: accountOperation.method,
			suffix: `Account`,
			params: accountOperation.params,
		});

		code.push(accountOutput.code);
		imports = new Set([...imports, ...accountOutput.imports]);
		jsExports.push(...accountOutput.jsExports);
		dependencies.push(...accountOutput.dependencies);
		typeExports.push(...accountOutput.typeExports);
		scopedParams.account = accountOutput;
		scopedParams.accountOperation = accountOperation;
		scopedParams.accountPath = accountOperation.path;
		pathParamsNamesList.push(...accountOutput.pathParamsNamesList);
	}

	if (orgOperation) {
		const orgOutput = processSingleGroupedOperation({
			route: orgOperation.path,
			operation: orgOperation.operation,
			operationId,
			verb: orgOperation.method,
			params: orgOperation.params,
			suffix: `Org`,
		});

		code.push(orgOutput.code);
		imports = new Set([...imports, ...orgOutput.imports]);
		jsExports.push(...orgOutput.jsExports);
		dependencies.push(...orgOutput.dependencies);
		typeExports.push(...orgOutput.typeExports);
		scopedParams.org = orgOutput;
		scopedParams.orgOperation = orgOperation;
		scopedParams.orgPath = orgOperation.path;
		pathParamsNamesList.push(...orgOutput.pathParamsNamesList);
	}

	if (projectOperation) {
		const projOutput = processSingleGroupedOperation({
			route: projectOperation.path,
			operation: projectOperation.operation,
			operationId,
			verb: projectOperation.method,
			params: projectOperation.params,
			suffix: `Project`,
		});

		code.push(projOutput.code);
		imports = new Set([...imports, ...projOutput.imports]);
		jsExports.push(...projOutput.jsExports);
		dependencies.push(...projOutput.dependencies);
		typeExports.push(...projOutput.typeExports);
		scopedParams.project = projOutput;
		scopedParams.projectOperation = projectOperation;
		scopedParams.projectPath = projectOperation.path;
		pathParamsNamesList.push(...projOutput.pathParamsNamesList);
	}

	const fetcherName = `${camelCase(operationId)}`;
	const fetcherPropsName = `${typeName}Props`;
	const okResponseName = `${typeName}OKResponse`;
	const errorResponseName = `${typeName}ErrorResponse`;

	const templateProps = {
		hookName,
		fetcherName,
		fetcherPropsName,
		okResponseName,
		errorResponseName,
		mutationPropsName,
		pathParamsNamesList: [...new Set(pathParamsNamesList)],
		...scopedParams,
	};

	code.push(liquid.renderSync(COMMON_GROUPED_FETCHER_TEMPLATE, templateProps));

	if (useMutation) {
		code.push(liquid.renderSync(GROUPED_MUTATION_HOOK_TEMPLATE, templateProps));
	} else {
		code.push(liquid.renderSync(GROUPED_QUERY_HOOK_TEMPLATE, templateProps));
	}

	imports.add(`import type { GetPathParamsType, ResponseWithPagination } from "../helpers";`);
	imports.add(`import { fetcher, FetcherOptions } from "${customFetcher || './fetcher'}";`);

	if (queryOrMutation === 'Query') {
		imports = new Set([
			'import { useQuery, UseQueryOptions } from "@tanstack/react-query";',
			'',
			...imports,
		]);
	} else {
		// typeExports.push(mutationPropsName);
		imports = new Set([
			'import { useMutation, UseMutationOptions } from "@tanstack/react-query";',
			'',
			...imports,
		]);
	}

	jsExports.push(hookName, fetcherName);

	return {
		code: liquid.renderSync(CODE_WITH_IMPORTS_TEMPLATE, {
			imports,
			code: code.join('\n\n'),
		}),
		filepath: `hooks/${hookName}.ts`,
		ref: '',
		dependencies,
		jsExports,
		typeExports,
	};
}
