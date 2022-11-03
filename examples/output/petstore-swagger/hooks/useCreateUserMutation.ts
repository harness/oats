/* This is a sample header */
/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import type { User } from '../schemas/User';
import { fetcher, FetcherOptions } from './fetcher';

export type CreateUserRequestBody = User;

export type CreateUserOkResponse = unknown;

export type CreateUserErrorResponse = unknown;

export interface CreateUserProps
	extends Omit<FetcherOptions<unknown, CreateUserRequestBody>, 'url'> {
	body: CreateUserRequestBody;
}

export function createUser(props: CreateUserProps): Promise<CreateUserOkResponse> {
	const { ...rest } = props;

	return fetcher<CreateUserOkResponse, unknown, CreateUserRequestBody>({
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
	options?: Omit<
		UseMutationOptions<CreateUserOkResponse, CreateUserErrorResponse>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<CreateUserOkResponse, CreateUserErrorResponse>(
		() => createUser(props),
		options,
	);
}
