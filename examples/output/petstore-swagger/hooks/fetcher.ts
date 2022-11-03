/* This is a sample header */
export interface FetcherOptions<TQueryParams = never, TBody = never>
	extends Omit<RequestInit, 'body'> {
	url: string;
	queryParams?: TQueryParams extends never ? undefined : TQueryParams;
	body?: TBody extends never ? undefined : TBody;
}

const JSON_HEADERS = ['application/json'];

export async function fetcher<TResponse = unknown, TQueryParams = never, TBody = never>(
	options: FetcherOptions<TQueryParams, TBody>,
): Promise<TResponse> {
	const { body, url, queryParams, ...rest } = options;

	const response = await fetch(url, {
		body: body ? JSON.stringify(body) : undefined,
		...rest,
	});

	const contentType = response.headers.get('Content-Type');
	const asJson = contentType && JSON_HEADERS.some((h) => contentType.startsWith(h));

	const data = await (asJson ? response.json() : response.text());

	if (response.ok) {
		return data;
	}

	throw data;
}
