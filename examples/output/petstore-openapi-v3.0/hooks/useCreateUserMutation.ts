/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import type { User } from '../schemas/User';
import { fetcher, FetcherOptions } from './fetcher';

export type CreateUserRequestBody = User;

export type CreateUserOkResponse = unknown;

export type CreateUserErrorResponse = User;

export interface CreateUserProps
	extends Omit<FetcherOptions<unknown, CreateUserRequestBody>, 'url'> {
	body: CreateUserRequestBody;
}

export function createUser(props: CreateUserProps): Promise<CreateUserOkResponse> {
	return fetcher<CreateUserOkResponse, unknown, CreateUserRequestBody>({
		url: `/user`,
		method: 'POST',
		...props,
	});
}

export type CreateUserMutationProps<T extends keyof CreateUserProps> = Omit<CreateUserProps, T> &
	Partial<Pick<CreateUserProps, T>>;

/**
 * This can only be done by the logged in user.
 */
export function useCreateUserMutation<T extends keyof CreateUserProps>(
	props: Pick<Partial<CreateUserProps>, T>,
	options?: Omit<
		UseMutationOptions<CreateUserOkResponse, CreateUserErrorResponse, CreateUserMutationProps<T>>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<CreateUserOkResponse, CreateUserErrorResponse, CreateUserMutationProps<T>>(
		(mutateProps: CreateUserMutationProps<T>) =>
			createUser({ ...props, ...mutateProps } as CreateUserProps),
		options,
	);
}
