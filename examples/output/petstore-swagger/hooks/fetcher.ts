/* This is a sample header */
export interface FetcherOptions<TQueryParams = never, TBody = never, THeaderParams = HeadersInit>
	extends Omit<RequestInit, 'body' | 'headers'> {
	url: string;
	queryParams?: TQueryParams extends never ? undefined : TQueryParams;
	body?: TBody extends never ? undefined : TBody;
	headers?: THeaderParams;
}

const JSON_HEADERS = ['application/json'];

interface ResponseContainer<TResponse, TResponseHeaders> {
	content: TResponse;
	headers: TResponseHeaders;
}

export async function fetcher<
	TResponse = unknown,
	TQueryParams = never,
	TBody = never,
	THeaderParams = HeadersInit,
>(
	options: FetcherOptions<TQueryParams, TBody, THeaderParams>,
): Promise<ResponseContainer<TResponse, Headers>> {
	const { body, url, queryParams, headers, ...rest } = options;

	const response = await fetch(url, {
		body: body ? JSON.stringify(body) : undefined,
		headers: {
			'Content-Type': JSON_HEADERS[0],
			...(headers as HeadersInit),
		},
		...rest,
	});

	const contentType = response.headers.get('Content-Type');
	const asJson = contentType && JSON_HEADERS.some((h) => contentType.startsWith(h));

	const data = await (asJson ? response.json() : response.text());

	if (response.ok) {
		return {
			content: data,
			headers: response.headers,
		};
	}

	throw data;
}
