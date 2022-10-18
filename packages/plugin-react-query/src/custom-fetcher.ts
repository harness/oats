export interface FetcherOptions<TQueryParams = never, TBody = never>
	extends Omit<RequestInit, 'body'> {
	url: string;
	queryParams?: TQueryParams extends never ? undefined : TQueryParams;
	body?: TBody extends never ? undefined : TBody;
}

export interface FetcherFn<TResponse = unknown, TQueryParams = never, TBody = never> {
	(options: FetcherOptions<TQueryParams, TBody>): Promise<TResponse>;
}
