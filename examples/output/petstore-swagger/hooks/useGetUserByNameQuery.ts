/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import type { User } from '../schemas/User';
import { fetcher, FetcherOptions } from './fetcher';

export interface UseGetUserByNameQueryPathParams {
	username: string;
}

export type GetUserByNameResponse = User;

export type GetUserByNameError = unknown;

export interface GetUserByNameProps
	extends UseGetUserByNameQueryPathParams,
		Omit<FetcherOptions<unknown, unknown>, 'url'> {}

export function getUserByName(props: GetUserByNameProps): Promise<GetUserByNameResponse> {
	const { username, ...rest } = props;

	return fetcher<GetUserByNameResponse, unknown, unknown>({
		url: `/user/${username}`,
		method: 'GET',
		...rest,
	});
}

/**
 *
 */
export function useGetUserByNameQuery(
	props: GetUserByNameProps,
	options: Omit<UseQueryOptions<GetUserByNameResponse, GetUserByNameError>, 'queryKey' | 'queryFn'>,
) {
	return useQuery<GetUserByNameResponse, GetUserByNameError>(
		['getUserByName'],
		({ signal }) => getUserByName({ ...props, signal }),
		options,
	);
}
