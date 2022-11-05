/* This is a sample header */
/* eslint-disable */
// This code is autogenerated using @harnessio/oats CLI.
// Please do not modify this code directly.
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import type { Pet } from '../schemas/Pet';
import { fetcher, FetcherOptions } from './fetcher';

export interface FindPetsByStatusQueryQueryParams {
	status: Array<'available' | 'pending' | 'sold'>;
}

export type FindPetsByStatusOkResponse = Pet[];

export type FindPetsByStatusErrorResponse = unknown;

export interface FindPetsByStatusProps
	extends Omit<FetcherOptions<FindPetsByStatusQueryQueryParams, unknown>, 'url'> {
	queryParams: FindPetsByStatusQueryQueryParams;
}

export function findPetsByStatus(
	props: FindPetsByStatusProps,
): Promise<FindPetsByStatusOkResponse> {
	const { ...rest } = props;

	return fetcher<FindPetsByStatusOkResponse, FindPetsByStatusQueryQueryParams, unknown>({
		url: `/pet/findByStatus`,
		method: 'GET',
		...rest,
	});
}

/**
 * Multiple status values can be provided with comma separated strings
 */
export function useFindPetsByStatusQuery(
	props: FindPetsByStatusProps,
	options?: Omit<
		UseQueryOptions<FindPetsByStatusOkResponse, FindPetsByStatusErrorResponse>,
		'queryKey' | 'queryFn'
	>,
) {
	return useQuery<FindPetsByStatusOkResponse, FindPetsByStatusErrorResponse>(
		['findPetsByStatus', props.queryParams],
		({ signal }) => findPetsByStatus({ ...props, signal }),
		options,
	);
}
