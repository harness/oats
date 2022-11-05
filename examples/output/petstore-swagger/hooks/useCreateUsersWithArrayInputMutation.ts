/* This is a sample header */
/* eslint-disable */
// This code is autogenerated using @harnessio/oats CLI.
// Please do not modify this code directly.
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import type { UserArrayRequestBody } from '../requestBodies/UserArrayRequestBody';
import { fetcher, FetcherOptions } from './fetcher';

export type CreateUsersWithArrayInputRequestBody = UserArrayRequestBody;

export type CreateUsersWithArrayInputOkResponse = unknown;

export type CreateUsersWithArrayInputErrorResponse = unknown;

export interface CreateUsersWithArrayInputProps
	extends Omit<FetcherOptions<unknown, CreateUsersWithArrayInputRequestBody>, 'url'> {
	body: CreateUsersWithArrayInputRequestBody;
}

export function createUsersWithArrayInput(
	props: CreateUsersWithArrayInputProps,
): Promise<CreateUsersWithArrayInputOkResponse> {
	const { ...rest } = props;

	return fetcher<
		CreateUsersWithArrayInputOkResponse,
		unknown,
		CreateUsersWithArrayInputRequestBody
	>({
		url: `/user/createWithArray`,
		method: 'POST',
		...rest,
	});
}

/**
 *
 */
export function useCreateUsersWithArrayInputMutation(
	props: CreateUsersWithArrayInputProps,
	options?: Omit<
		UseMutationOptions<CreateUsersWithArrayInputOkResponse, CreateUsersWithArrayInputErrorResponse>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<CreateUsersWithArrayInputOkResponse, CreateUsersWithArrayInputErrorResponse>(
		() => createUsersWithArrayInput(props),
		options,
	);
}
