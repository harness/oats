/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import type { Pet } from '../schemas/Pet';
import { fetcher, FetcherOptions } from './fetcher';

export interface FindPetsByTagsQueryQueryParams {
	tags?: string[];
}

export type FindPetsByTagsOkResponse = Pet[];

export type FindPetsByTagsErrorResponse = unknown;

export interface FindPetsByTagsProps
	extends Omit<FetcherOptions<FindPetsByTagsQueryQueryParams, unknown>, 'url'> {
	queryParams: FindPetsByTagsQueryQueryParams;
}

export interface FindPetsByTagsResponseContainer {
	content: FindPetsByTagsOkResponse;
	headers: HeadersInit;
}

export function findPetsByTags(
	props: FindPetsByTagsProps,
): Promise<FindPetsByTagsResponseContainer> {
	return fetcher<FindPetsByTagsOkResponse, FindPetsByTagsQueryQueryParams, unknown>({
		url: `/pet/findByTags`,
		method: 'GET',
		...props,
	});
}

/**
 * Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 */
export function useFindPetsByTagsQuery(
	props: FindPetsByTagsProps,
	options?: Omit<
		UseQueryOptions<FindPetsByTagsResponseContainer, FindPetsByTagsErrorResponse>,
		'queryKey' | 'queryFn'
	>,
) {
	return useQuery<FindPetsByTagsResponseContainer, FindPetsByTagsErrorResponse>(
		['findPetsByTags', props.queryParams],
		({ signal }) => findPetsByTags({ ...props, signal }),
		options,
	);
}
