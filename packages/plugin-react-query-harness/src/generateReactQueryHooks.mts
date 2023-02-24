import { OpenAPIV3 } from 'openapi-types';
import type { ICodeOutput, IPlugin, IPluginReturn } from '@harnessio/oats-cli';
import { isReferenceObject } from '@harnessio/oats-cli';

import type { IConfig, IScopeGroupingSchema } from './config.mjs';
import { Config } from './config.mjs';
import { _readTemplate, liquid } from './helpers.mjs';
import { IOperation, processScopedOperations } from './processScopedOperations.mjs';
import { processOperation } from './processOperation.mjs';

const ALLOWED_VERBS: Array<OpenAPIV3.HttpMethods> = Object.values(OpenAPIV3.HttpMethods);
const DEFAULT_FETCHER_TEMPLATE = liquid.parse(_readTemplate('defaultFetcher.liquid'));
const HELPERS_TEMPLATE = liquid.parse(_readTemplate('helpers.liquid'));

export type IOperationMap = Map<string, IOperation>;

export function generateReactQueryHooks(unsafeConfig?: IConfig): IPlugin['generate'] {
	return async (spec: OpenAPIV3.Document): Promise<IPluginReturn> => {
		// validate config
		const config = Config.parse(unsafeConfig);

		const files: ICodeOutput[] = [
			{
				code: liquid.renderSync(HELPERS_TEMPLATE),
				filepath: 'helpers.ts',
				ref: '',
				dependencies: [],
				jsExports: [],
				typeExports: ['GetPathParamsType', 'ResponseWithPagination'],
			},
		];

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
						if (accumulator.has(operation.operationId)) {
							throw new Error(
								`Operation with operationId "${operation.operationId}" already exists, Please provide a unique key.`,
							);
						}

						accumulator.set(operation.operationId, {
							method: verb,
							path: route,
							operation: {
								...operation,
								operationId: operation.operationId,
							},
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

		// Generate code for scoped groups
		if (config?.scopeGroups) {
			Object.entries(config.scopeGroups).forEach(
				([key, groupConfig]: [string, IScopeGroupingSchema]) => {
					// check if operationId is already used
					if (operationIdMap.has(key)) {
						throw new Error(
							`Operation with operationId "${key}" already exists, Please provide a unique key.`,
						);
					}
					const { account, organisation, project } = Array.isArray(groupConfig)
						? {
								account: groupConfig[0],
								organisation: groupConfig[1],
								project: groupConfig[2],
						  }
						: groupConfig?.operations || {};

					const useMutation = Array.isArray(groupConfig) ? false : !!groupConfig?.useMutation;

					const getOpAndDelete = (operationId: string): IOperation | undefined => {
						const temp = operationIdMap.get(operationId);
						operationIdMap.delete(operationId);
						return temp;
					};

					if (!account || !operationIdMap.has(account)) {
						throw new Error(`Could not find account level operation with id: "${account}"`);
					}

					if (!organisation || !operationIdMap.has(organisation)) {
						throw new Error(`Could not find organisation level operation with id: "${account}"`);
					}

					if (!project || !operationIdMap.has(project)) {
						throw new Error(`Could not find project level operation with id: "${account}"`);
					}

					files.push(
						processScopedOperations({
							operationId: key,
							accountOperation: getOpAndDelete(account),
							orgOperation: getOpAndDelete(organisation),
							projectOperation: getOpAndDelete(project),
							useMutation,
						}),
					);
				},
			);
		}

		// generate code for rest of the operations
		operationIdMap.forEach((op) => {
			files.push(processOperation(op, config));
		});

		return { files };
	};
}
