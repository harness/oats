/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import type { Repository } from '../schemas/Repository';
import type { NotModifiedResponse } from '../responses/NotModifiedResponse';
import type { RequiresAuthenticationResponse } from '../responses/RequiresAuthenticationResponse';
import type { ForbiddenResponse } from '../responses/ForbiddenResponse';
import type { ValidationFailedResponse } from '../responses/ValidationFailedResponse';
import { fetcher, FetcherOptions } from './fetcher';

export interface ReposListForAuthenticatedUserQueryQueryParams {
	/**
	 * @default "all"
	 */
	visibility?: 'all' | 'private' | 'public';
	/**
	 * @default "owner,collaborator,organization_member"
	 */
	affiliation?: string;
	/**
	 * @default "all"
	 */
	type?: 'all' | 'member' | 'owner' | 'private' | 'public';
	/**
	 * @default "full_name"
	 */
	sort?: 'created' | 'full_name' | 'pushed' | 'updated';
	direction?: 'asc' | 'desc';
	/**
	 * @default 30
	 */
	per_page?: number;
	/**
	 * @default 1
	 */
	page?: number;
	/**
	 * @format date-time
	 */
	since?: string;
	/**
	 * @format date-time
	 */
	before?: string;
}

export type ReposListForAuthenticatedUserOkResponse = Repository[];

export type ReposListForAuthenticatedUserErrorResponse =
	| NotModifiedResponse
	| RequiresAuthenticationResponse
	| ForbiddenResponse
	| ValidationFailedResponse;

export interface ReposListForAuthenticatedUserProps
	extends Omit<FetcherOptions<ReposListForAuthenticatedUserQueryQueryParams, unknown>, 'url'> {
	queryParams: ReposListForAuthenticatedUserQueryQueryParams;
}

export interface ReposListForAuthenticatedUserResponseContainer {
	content: ReposListForAuthenticatedUserOkResponse;
	headers: HeadersInit;
}

export function reposListForAuthenticatedUser(
	props: ReposListForAuthenticatedUserProps,
): Promise<ReposListForAuthenticatedUserResponseContainer> {
	return fetcher<
		ReposListForAuthenticatedUserOkResponse,
		ReposListForAuthenticatedUserQueryQueryParams,
		unknown
	>({
		url: `/user/repos`,
		method: 'GET',
		...props,
	});
}

/**
 * Lists repositories that the authenticated user has explicit permission (`:read`, `:write`, or `:admin`) to access.
 *
 * The authenticated user has explicit permission to access repositories they own, repositories where they are a collaborator, and repositories that they can access through an organization membership.
 */
export function useReposListForAuthenticatedUserQuery(
	props: ReposListForAuthenticatedUserProps,
	options?: Omit<
		UseQueryOptions<
			ReposListForAuthenticatedUserResponseContainer,
			ReposListForAuthenticatedUserErrorResponse
		>,
		'queryKey' | 'queryFn'
	>,
) {
	return useQuery<
		ReposListForAuthenticatedUserResponseContainer,
		ReposListForAuthenticatedUserErrorResponse
	>(
		['repos/list-for-authenticated-user', props.queryParams],
		({ signal }) => reposListForAuthenticatedUser({ ...props, signal }),
		options,
	);
}
