/* This is a sample header */
/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { fetcher, FetcherOptions } from './fetcher';

export type GetInventoryOkResponse = { [key: string]: number };

export type GetInventoryErrorResponse = unknown;

export interface GetInventoryProps extends Omit<FetcherOptions<unknown, unknown>, 'url'> {}

export interface GetInventoryResponseContainer {
	content: GetInventoryOkResponse;
	headers: Headers;
}

export function getInventory(props: GetInventoryProps): Promise<GetInventoryResponseContainer> {
	return fetcher<GetInventoryOkResponse, unknown, unknown>({
		url: `/store/inventory`,
		method: 'GET',
		...props,
	});
}

/**
 * Returns a map of status codes to quantities
 */
export function useGetInventoryQuery(
	props: GetInventoryProps,
	options?: Omit<
		UseQueryOptions<GetInventoryResponseContainer, GetInventoryErrorResponse>,
		'queryKey' | 'queryFn'
	>,
) {
	return useQuery<GetInventoryResponseContainer, GetInventoryErrorResponse>(
		['getInventory'],
		({ signal }) => getInventory({ ...props, signal }),
		options,
	);
}
