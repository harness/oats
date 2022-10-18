import { pascalCase } from 'change-case';

export function getNameForType(name: string): string {
	return pascalCase(name);
}

export function getNameForResponse(name: string): string {
	return getNameForType(name) + 'Response';
}

export function getNameForErrorResponse(name: string): string {
	return getNameForType(name) + 'Error';
}

export function getNameForParameter(name: string): string {
	return getNameForType(name) + 'Parameter';
}

export function getNameForRequestBody(name: string): string {
	return getNameForType(name) + 'RequestBody';
}

export function getNameForPathParams(name: string): string {
	return getNameForType(name) + 'PathParams';
}

export function getNameForQueryParams(name: string): string {
	return getNameForType(name) + 'QueryParams';
}
