/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { fetcher, FetcherOptions } from './fetcher';

export interface LoginUserQueryQueryParams {
	username?: string;
	password?: string;
}

export type LoginUserOkResponse = string;

export type LoginUserErrorResponse = unknown;

export interface LoginUserProps
	extends Omit<FetcherOptions<LoginUserQueryQueryParams, unknown>, 'url'> {
	queryParams: LoginUserQueryQueryParams;
}

export interface LoginUserResponseContainer {
	content: LoginUserOkResponse;
	headers: Record<string, any>;
}

export function loginUser(props: LoginUserProps): Promise<LoginUserResponseContainer> {
	return fetcher<LoginUserOkResponse, LoginUserQueryQueryParams, unknown>({
		url: `/user/login`,
		method: 'GET',
		...props,
	});
}

/**
 *
 */
export function useLoginUserQuery(
	props: LoginUserProps,
	options?: Omit<
		UseQueryOptions<LoginUserResponseContainer, LoginUserErrorResponse>,
		'queryKey' | 'queryFn'
	>,
) {
	return useQuery<LoginUserResponseContainer, LoginUserErrorResponse>(
		['loginUser', props.queryParams],
		({ signal }) => loginUser({ ...props, signal }),
		options,
	);
}
