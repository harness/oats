/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import type { User } from '../schemas/User';
import { fetcher, FetcherOptions } from './fetcher';

export type CreateUsersWithListInputRequestBody = User[];

export type CreateUsersWithListInputOkResponse = User;

export type CreateUsersWithListInputErrorResponse = unknown;

export interface CreateUsersWithListInputProps
	extends Omit<FetcherOptions<unknown, CreateUsersWithListInputRequestBody>, 'url'> {
	body: CreateUsersWithListInputRequestBody;
}

export function createUsersWithListInput(
	props: CreateUsersWithListInputProps,
): Promise<CreateUsersWithListInputOkResponse> {
	const { ...rest } = props;

	return fetcher<CreateUsersWithListInputOkResponse, unknown, CreateUsersWithListInputRequestBody>({
		url: `/user/createWithList`,
		method: 'POST',
		...rest,
	});
}

/**
 * Creates list of users with given input array
 */
export function useCreateUsersWithListInputMutation(
	props: CreateUsersWithListInputProps,
	options: Omit<
		UseMutationOptions<CreateUsersWithListInputOkResponse, CreateUsersWithListInputErrorResponse>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<CreateUsersWithListInputOkResponse, CreateUsersWithListInputErrorResponse>(
		() => createUsersWithListInput(props),
		options,
	);
}
