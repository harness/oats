/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import type { Pet } from '../schemas/Pet';
import { fetcher, FetcherOptions } from './fetcher';

export interface FindPetsByStatusQueryQueryParams {
	/**
	 * @default "available"
	 */
	status?: 'available' | 'pending' | 'sold';
}

export type FindPetsByStatusOkResponse = Pet[];

export type FindPetsByStatusErrorResponse = unknown;

export interface FindPetsByStatusProps
	extends Omit<FetcherOptions<FindPetsByStatusQueryQueryParams, unknown>, 'url'> {
	queryParams: FindPetsByStatusQueryQueryParams;
}

export interface FindPetsByStatusResponseContainer {
	content: FindPetsByStatusOkResponse;
	headers: Record<string, any>;
}

export function findPetsByStatus(
	props: FindPetsByStatusProps,
): Promise<FindPetsByStatusResponseContainer> {
	return fetcher<FindPetsByStatusOkResponse, FindPetsByStatusQueryQueryParams, unknown>({
		url: `/pet/findByStatus`,
		method: 'GET',
		...props,
	});
}

/**
 * Multiple status values can be provided with comma separated strings
 */
export function useFindPetsByStatusQuery(
	props: FindPetsByStatusProps,
	options?: Omit<
		UseQueryOptions<FindPetsByStatusResponseContainer, FindPetsByStatusErrorResponse>,
		'queryKey' | 'queryFn'
	>,
) {
	return useQuery<FindPetsByStatusResponseContainer, FindPetsByStatusErrorResponse>(
		['findPetsByStatus', props.queryParams],
		({ signal }) => findPetsByStatus({ ...props, signal }),
		options,
	);
}
