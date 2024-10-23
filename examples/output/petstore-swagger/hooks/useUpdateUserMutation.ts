/* This is a sample header */
/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import type { User } from '../schemas/User';
import { fetcher, FetcherOptions } from './fetcher';

export interface UpdateUserMutationPathParams {
	username: string;
}

export type UpdateUserRequestBody = User;

export type UpdateUserOkResponse = unknown;

export type UpdateUserErrorResponse = unknown;

export interface UpdateUserProps
	extends UpdateUserMutationPathParams,
		Omit<FetcherOptions<unknown, UpdateUserRequestBody>, 'url'> {
	body: UpdateUserRequestBody;
}

export interface UpdateUserResponseContainer {
	content: UpdateUserOkResponse;
	headers: Record<string, any>;
}

export function updateUser(props: UpdateUserProps): Promise<UpdateUserResponseContainer> {
	return fetcher<UpdateUserOkResponse, unknown, UpdateUserRequestBody>({
		url: `/user/${props.username}`,
		method: 'PUT',
		...props,
	});
}

export type UpdateUserMutationProps<T extends keyof UpdateUserProps> = Omit<UpdateUserProps, T> &
	Partial<Pick<UpdateUserProps, T>>;

/**
 * This can only be done by the logged in user.
 */
export function useUpdateUserMutation<T extends keyof UpdateUserProps>(
	props: Pick<Partial<UpdateUserProps>, T>,
	options?: Omit<
		UseMutationOptions<
			UpdateUserResponseContainer,
			UpdateUserErrorResponse,
			UpdateUserMutationProps<T>
		>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<
		UpdateUserResponseContainer,
		UpdateUserErrorResponse,
		UpdateUserMutationProps<T>
	>(
		(mutateProps: UpdateUserMutationProps<T>) =>
			updateUser({ ...props, ...mutateProps } as UpdateUserProps),
		options,
	);
}
