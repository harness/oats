/* This is a sample header */
/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { fetcher, FetcherOptions } from './fetcher';

export interface UseLoginUserQueryQueryParams {
	username: string;
	password: string;
}

export type LoginUserOkResponse = string;

export type LoginUserErrorResponse = unknown;

export interface LoginUserProps
	extends Omit<FetcherOptions<UseLoginUserQueryQueryParams, unknown>, 'url'> {
	queryParams: UseLoginUserQueryQueryParams;
}

export function loginUser(props: LoginUserProps): Promise<LoginUserOkResponse> {
	const { ...rest } = props;

	return fetcher<LoginUserOkResponse, UseLoginUserQueryQueryParams, unknown>({
		url: `/user/login`,
		method: 'GET',
		...rest,
	});
}

/**
 *
 */
export function useLoginUserQuery(
	props: LoginUserProps,
	options?: Omit<
		UseQueryOptions<LoginUserOkResponse, LoginUserErrorResponse>,
		'queryKey' | 'queryFn'
	>,
) {
	return useQuery<LoginUserOkResponse, LoginUserErrorResponse>(
		['loginUser'],
		({ signal }) => loginUser({ ...props, signal }),
		options,
	);
}
