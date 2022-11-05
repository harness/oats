/* This is a sample header */
/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import type { UserArrayRequestBody } from '../requestBodies/UserArrayRequestBody';
import { fetcher, FetcherOptions } from './fetcher';

export type CreateUsersWithListInputRequestBody = UserArrayRequestBody;

export type CreateUsersWithListInputOkResponse = unknown;

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
 *
 */
export function useCreateUsersWithListInputMutation(
	props: CreateUsersWithListInputProps,
	options?: Omit<
		UseMutationOptions<CreateUsersWithListInputOkResponse, CreateUsersWithListInputErrorResponse>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<CreateUsersWithListInputOkResponse, CreateUsersWithListInputErrorResponse>(
		() => createUsersWithListInput(props),
		options,
	);
}
