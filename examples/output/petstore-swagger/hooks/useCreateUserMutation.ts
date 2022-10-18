/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import type { User } from '../schemas/User';
import { fetcher, FetcherOptions } from './fetcher';

export type CreateUserResponse = unknown;

export type CreateUserError = unknown;

export interface CreateUserProps extends Omit<FetcherOptions<unknown, unknown>, 'url'> {}

export function createUser(props: CreateUserProps): Promise<CreateUserResponse> {
	const { ...rest } = props;

	return fetcher<CreateUserResponse, unknown, unknown>({
		url: `/user`,
		method: 'POST',
		...rest,
	});
}

/**
 * This can only be done by the logged in user.
 */
export function useCreateUserMutation(
	props: CreateUserProps,
	options: Omit<
		UseMutationOptions<CreateUserResponse, CreateUserError>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<CreateUserResponse, CreateUserError>(() => createUser(props), options);
}
