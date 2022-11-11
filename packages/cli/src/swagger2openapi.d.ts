declare module 'swagger2openapi' {
	import { OpenAPIV3 } from 'openapi-types';
	interface IConverObjCallbackData {
		openapi: OpenAPIV3.Document;
	}
	function convertObj(
		schema: unknown,
		options: unknown,
		callback: (err: Error, data: ConverObjCallbackData) => void,
	): void;
}
