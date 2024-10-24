/* This is a sample header */
/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
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

export interface CreateUsersWithArrayInputResponseContainer {
	content: CreateUsersWithArrayInputOkResponse;
	headers: HeadersInit;
}

export function createUsersWithArrayInput(
	props: CreateUsersWithArrayInputProps,
): Promise<CreateUsersWithArrayInputResponseContainer> {
	return fetcher<
		CreateUsersWithArrayInputOkResponse,
		unknown,
		CreateUsersWithArrayInputRequestBody
	>({
		url: `/user/createWithArray`,
		method: 'POST',
		...props,
	});
}

export type CreateUsersWithArrayInputMutationProps<T extends keyof CreateUsersWithArrayInputProps> =
	Omit<CreateUsersWithArrayInputProps, T> & Partial<Pick<CreateUsersWithArrayInputProps, T>>;

/**
 *
 */
export function useCreateUsersWithArrayInputMutation<
	T extends keyof CreateUsersWithArrayInputProps,
>(
	props: Pick<Partial<CreateUsersWithArrayInputProps>, T>,
	options?: Omit<
		UseMutationOptions<
			CreateUsersWithArrayInputResponseContainer,
			CreateUsersWithArrayInputErrorResponse,
			CreateUsersWithArrayInputMutationProps<T>
		>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<
		CreateUsersWithArrayInputResponseContainer,
		CreateUsersWithArrayInputErrorResponse,
		CreateUsersWithArrayInputMutationProps<T>
	>(
		(mutateProps: CreateUsersWithArrayInputMutationProps<T>) =>
			createUsersWithArrayInput({ ...props, ...mutateProps } as CreateUsersWithArrayInputProps),
		options,
	);
}
