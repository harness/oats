/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { fetcher, FetcherOptions } from './fetcher';

export type LogoutUserOkResponse = unknown;

export type LogoutUserErrorResponse = unknown;

export interface LogoutUserProps extends Omit<FetcherOptions<unknown, unknown>, 'url'> {}

export interface LogoutUserResponseContainer {
	body: LogoutUserOkResponse;
	headers: Headers;
}

export function logoutUser(props: LogoutUserProps): Promise<LogoutUserResponseContainer> {
	return fetcher<LogoutUserOkResponse, unknown, unknown>({
		url: `/user/logout`,
		method: 'GET',
		...props,
	});
}

/**
 *
 */
export function useLogoutUserQuery(
	props: LogoutUserProps,
	options?: Omit<
		UseQueryOptions<LogoutUserResponseContainer, LogoutUserErrorResponse>,
		'queryKey' | 'queryFn'
	>,
) {
	return useQuery<LogoutUserResponseContainer, LogoutUserErrorResponse>(
		['logoutUser'],
		({ signal }) => logoutUser({ ...props, signal }),
		options,
	);
}
