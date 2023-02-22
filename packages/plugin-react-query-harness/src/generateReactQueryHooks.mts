import { OpenAPIV3 } from 'openapi-types';
import { camelCase } from 'change-case';
import type { ICodeOutput, IObjectProps, IPlugin, IPluginReturn } from '@harnessio/oats-cli';
import {
	// processPaths,
	// getErrorResponses,
	// getOkResponses,
	// getReqResTypes,
	// getNameForErrorResponse,
	// getNameForRequestBody,
	// getNameForOkResponse,
	getNameForType,
	resolveValue,
	CODE_WITH_IMPORTS_TEMPLATE,
	COMMENTS_TEMPLATE,
	isReferenceObject,
	// OBJECT_TEMPLATE,
} from '@harnessio/oats-cli';

import type { IConfig } from './config.mjs';
import { Config } from './config.mjs';
import { _readTemplate, liquid } from './helpers.mjs';
import { processOperation } from './processOperation.mjs';

const ALLOWED_VERBS: Array<OpenAPIV3.HttpMethods> = Object.values(OpenAPIV3.HttpMethods);
const DEFAULT_FETCHER_TEMPLATE = liquid.parse(_readTemplate('defaultFetcher.liquid'));
// const COMMON_TEMPLATE = liquid.parse(_readTemplate('reactQueryCommon.liquid'));
const COMMON_GROUPED_FETCHER = liquid.parse(_readTemplate('commonGroupedFetcher.liquid'));
// const QUERY_TEMPLATE = liquid.parse(_readTemplate('useQueryHook.liquid'));
// const MUTATION_TEMPLATE = liquid.parse(_readTemplate('useMutationHook.liquid'));
// const METHODS_WITH_BODY = ['post', 'put', 'patch'];

export interface IOperation {
	method: OpenAPIV3.HttpMethods;
	path: string;
	operation: OpenAPIV3.OperationObject;
	params: OpenAPIV3.ParameterObject[];
}

export type IOperationMap = Map<string, IOperation>;

export interface IParamsCode {
	name: string;
	props: IObjectProps[];
}

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

export function generateReactQueryHooks(unsafeConfig?: IConfig): IPlugin['generate'] {
	return async (spec: OpenAPIV3.Document): Promise<IPluginReturn> => {
		// validate config
		const config = Config.parse(unsafeConfig);

		const files: ICodeOutput[] = [];
		let imports = new Set<string>();
		const dependencies: string[] = [];
		const jsExports: string[] = [];
		const typeExports: string[] = [];
		const operationIdMap: IOperationMap = Object.entries(spec.paths).reduce(
			(accumulator, [route, routeObj]) => {
				if (routeObj) {
					ALLOWED_VERBS.forEach((verb) => {
						const operation = routeObj[verb] as OpenAPIV3.OperationObject;

						if (!operation) return accumulator;

						// check for operationId
						if (!operation.operationId) {
							throw new Error(
								`Every path must have a operationId - No operationId set for ${verb} ${route}`,
							);
						}

						// check if operationId is already used
						if (operation.operationId in accumulator) {
							throw new Error(
								`"${operation.operationId}" is duplicated in your schema definition!`,
							);
						}

						accumulator.set(operation.operationId, {
							method: verb,
							path: route,
							operation,
							params: [...(routeObj.parameters || []), ...(operation.parameters || [])]
								.map((param): OpenAPIV3.ParameterObject => {
									if (isReferenceObject(param)) {
										const ref = param.$ref.replace('#/components/parameters/', '');
										if (spec.components?.parameters && ref in spec.components.parameters) {
											const resolved = spec.components.parameters[ref];

											if (isReferenceObject(resolved)) {
												throw new Error(`$ref inside #/components/parameters/* is not supported`);
											}

											return resolved;
										}

										throw new Error(`Could not resolve ${param.$ref}`);
									}

									return param;
								})
								.filter((p) => p),
						});
					});
				}

				return accumulator;
			},
			new Map() as IOperationMap,
		);

		if (config?.scopeGroups) {
			Object.entries(config.scopeGroups).forEach(([key, groupConfig]) => {
				const { account, organisation, project } = groupConfig.operations;
				const queryOrMutation: 'Query' | 'Mutation' = groupConfig.useMutation
					? 'Mutation'
					: 'Query';
				const typeName = getNameForType(key);
				const code: string[] = [];
				const hookName = `use${typeName}${queryOrMutation}`;
				const scopedParams: Record<string, any> = {};

				if (account) {
					const accountOperation = operationIdMap.get(account.operationId);

					if (!accountOperation) {
						throw new Error();
					}

					const accountOutput = processOperation({
						route: accountOperation.path,
						operation: accountOperation.operation,
						operationId: key,
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
				}

				if (organisation) {
					const orgOperation = operationIdMap.get(organisation.operationId);

					if (!orgOperation) {
						throw new Error();
					}

					const orgOutput = processOperation({
						route: orgOperation.path,
						operation: orgOperation.operation,
						operationId: key,
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
					scopedParams.orgPath = orgOperation.path.replace(`{org}`, '${org}');
				}

				if (project) {
					const projectOperation = operationIdMap.get(project.operationId);

					if (!projectOperation) {
						throw new Error();
					}

					const projOutput = processOperation({
						route: projectOperation.path,
						operation: projectOperation.operation,
						operationId: key,
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
					scopedParams.projectPath = projectOperation.path
						.replace(`{org}`, '${org}')
						.replace(`{project}`, '${project}');
				}

				const fetcherName = `${camelCase(key)}`;
				const fetcherPropsName = `${typeName}Props`;
				const okResponseName = `${typeName}OKResponse`;
				const errorResponseName = `${typeName}ErrorResponse`;

				code.push(
					liquid.renderSync(COMMON_GROUPED_FETCHER, {
						fetcherName,
						fetcherPropsName,
						okResponseName,
						errorResponseName,
						...scopedParams,
					}),
				);

				imports.add(
					`import { fetcher, FetcherOptions } from "${config?.customFetcher || './fetcher'}";`,
				);

				files.push({
					code: liquid.renderSync(CODE_WITH_IMPORTS_TEMPLATE, {
						imports,
						code: code.join('\n\n'),
					}),
					filepath: `hooks/${hookName}.ts`,
					ref: '',
					dependencies,
					jsExports,
					typeExports,
				});
			});
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

		return { files };
	};
}
