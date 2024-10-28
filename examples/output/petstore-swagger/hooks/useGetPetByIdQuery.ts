/* This is a sample header */
/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import type { Pet } from '../schemas/Pet';
import { fetcher, FetcherOptions } from './fetcher';

export interface GetPetByIdQueryPathParams {
	/**
	 * @format int64
	 */
	petId: number;
}

export type GetPetByIdOkResponse = Pet;

export type GetPetByIdErrorResponse = unknown;

export interface GetPetByIdProps
	extends GetPetByIdQueryPathParams,
		Omit<FetcherOptions<unknown, unknown>, 'url'> {}

export interface GetPetByIdResponseContainer {
	content: GetPetByIdOkResponse;
	headers: Headers;
}

export function getPetById(props: GetPetByIdProps): Promise<GetPetByIdResponseContainer> {
	return fetcher<GetPetByIdOkResponse, unknown, unknown>({
		url: `/pet/${props.petId}`,
		method: 'GET',
		...props,
	});
}

/**
 * Returns a single pet
 */
export function useGetPetByIdQuery(
	props: GetPetByIdProps,
	options?: Omit<
		UseQueryOptions<GetPetByIdResponseContainer, GetPetByIdErrorResponse>,
		'queryKey' | 'queryFn'
	>,
) {
	return useQuery<GetPetByIdResponseContainer, GetPetByIdErrorResponse>(
		['getPetById', props.petId],
		({ signal }) => getPetById({ ...props, signal }),
		options,
	);
}
