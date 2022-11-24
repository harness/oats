/* This is a sample header */
/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import type { User } from '../schemas/User';
import { fetcher, FetcherOptions } from './fetcher';

export interface GetUserByNameQueryPathParams {
	username: string;
}

export type GetUserByNameOkResponse = User;

export type GetUserByNameErrorResponse = unknown;

export interface GetUserByNameProps
	extends GetUserByNameQueryPathParams,
		Omit<FetcherOptions<unknown, unknown>, 'url'> {}

export function getUserByName(props: GetUserByNameProps): Promise<GetUserByNameOkResponse> {
	return fetcher<GetUserByNameOkResponse, unknown, unknown>({
		url: `/user/${props.username}`,
		method: 'GET',
		...props,
	});
}

/**
 *
 */
export function useGetUserByNameQuery(
	props: GetUserByNameProps,
	options?: Omit<
		UseQueryOptions<GetUserByNameOkResponse, GetUserByNameErrorResponse>,
		'queryKey' | 'queryFn'
	>,
) {
	return useQuery<GetUserByNameOkResponse, GetUserByNameErrorResponse>(
		['getUserByName', props.username],
		({ signal }) => getUserByName({ ...props, signal }),
		options,
	);
}
