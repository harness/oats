import type { OpenAPIV3 } from 'openapi-types';
import { camelCase } from 'change-case';
import type { ICodeOutput, IObjectProps } from '@harnessio/oats-cli';
import {
	getErrorResponses,
	getOkResponses,
	getReqResTypes,
	getNameForType,
	resolveValue,
	COMMENTS_TEMPLATE,
	OBJECT_TEMPLATE,
	groupByParamType,
} from '@harnessio/oats-cli';
import { _readTemplate, liquid } from './helpers.mjs';

const COMMON_TEMPLATE = liquid.parse(_readTemplate('commonGroupedTypes.liquid'));
const METHODS_WITH_BODY = ['post', 'put', 'patch'];

export type IParameterLocation = 'query' | 'header' | 'path' | 'cookie';

export function processParams(param: OpenAPIV3.ParameterObject): IObjectProps {
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
}

export function processOperation(props: IProcessOperationProps): IProcessOperationReturn {
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
		pathParams.length > 0 ? liquid.renderSync(OBJECT_TEMPLATE, { props: pathParams }) : null;
	const queryParamsCode =
		queryParams.length > 0 ? liquid.renderSync(OBJECT_TEMPLATE, { props: queryParams }) : null;
	const headerParamsCode =
		headerParams.length > 0 ? liquid.renderSync(OBJECT_TEMPLATE, { props: headerParams }) : null;

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
		pathParamsNamesList: groupedParams.path.map((p) => p.name),
		description: liquid.renderSync(COMMENTS_TEMPLATE, { schema: operation }).trimEnd(),
	};

	const code = liquid.renderSync(COMMON_TEMPLATE, templateProps).trim();

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

	return {
		code,
		filepath: ``,
		ref: '',
		dependencies,
		jsExports,
		typeExports,
		imports,
		okResponseName,
		errorResponseName,
		pathParamsName,
	};
}
