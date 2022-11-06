declare module 'swagger2openapi' {
	import { OpenAPIObject } from 'openapi3-ts';
	interface IConverObjCallbackData {
		openapi: OpenAPIObject;
	}
	function convertObj(
		schema: unknown,
		options: unknown,
		callback: (err: Error, data: ConverObjCallbackData) => void,
	): void;
}
