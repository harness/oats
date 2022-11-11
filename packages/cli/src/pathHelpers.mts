import { OpenAPIV3 } from 'openapi-types';
import { isReferenceObject } from './helpers.mjs';

const ALLOWED_VERBS: Array<OpenAPIV3.HttpMethods> = Object.values(OpenAPIV3.HttpMethods);

export type IParameterLocation = 'query' | 'header' | 'path' | 'cookie';

export function getParamsInPath(path: string): string[] {
	let n;
	const output = [];
	const templatePathRegex = /{(\w+?)}/g;

	while ((n = templatePathRegex.exec(path)) !== null) {
		output.push(n[1]);
	}

	return output;
}

export function groupByParamType(
	params: OpenAPIV3.ParameterObject[],
): Record<IParameterLocation, OpenAPIV3.ParameterObject[]> {
	const data: Record<IParameterLocation, OpenAPIV3.ParameterObject[]> = {
		query: [],
		header: [],
		path: [],
		cookie: [],
	};

	return params.reduce((p, c) => {
		if (p[c.in as IParameterLocation]) {
			p[c.in as IParameterLocation].push(c);
		}

		return p;
	}, data);
}

export function processPaths(
	spec: OpenAPIV3.Document,
	callback: (
		route: string,
		verb: string,
		operation: OpenAPIV3.OperationObject,
		params: Record<IParameterLocation, OpenAPIV3.ParameterObject[]>,
	) => void,
): void {
	const operationIds = new Set<string>();
	Object.entries(spec.paths || {}).forEach(([route, routeObj]) => {
		if (!routeObj) return;

		ALLOWED_VERBS.forEach((verb) => {
			const operation = routeObj[verb] as OpenAPIV3.OperationObject;

			if (!operation) return;

			// check for operationId
			if (!operation.operationId) {
				throw new Error(
					`Every path must have a operationId - No operationId set for ${verb} ${route}`,
				);
			}

			// check if operationId is already used
			if (operationIds.has(operation.operationId)) {
				throw new Error(`"${operation.operationId}" is duplicated in your schema definition!`);
			}

			// mark operationId as used
			operationIds.add(operation.operationId);

			const paramsInPath = getParamsInPath(route);

			const resolvedParams = [...(routeObj.parameters || []), ...(operation.parameters || [])]
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
				.filter((p) => p);

			const groupedParams = groupByParamType(resolvedParams);

			// check for path params definitions
			paramsInPath.forEach((pathParam) => {
				const paramDef = groupedParams.path.find((p) => p.name === pathParam);

				if (!paramDef) {
					throw new Error(`Could not find parameter definition for ${pathParam} in ${route}`);
				}

				if (!paramDef.required) {
					throw new Error(`Path param ${pathParam} in ${route} must be a required field`);
				}
			});

			callback(route, verb, operation, groupedParams);
		});
	});
}
