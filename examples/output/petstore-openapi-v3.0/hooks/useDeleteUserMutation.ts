/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import { fetcher, FetcherOptions } from './fetcher';

export interface DeleteUserMutationPathParams {
	username: string;
}

export type DeleteUserOkResponse = unknown;

export type DeleteUserErrorResponse = unknown;

export interface DeleteUserProps
	extends DeleteUserMutationPathParams,
		Omit<FetcherOptions<unknown, unknown>, 'url'> {}

export interface DeleteUserResponseContainer {
	body: DeleteUserOkResponse;
	headers: Headers;
}

export function deleteUser(props: DeleteUserProps): Promise<DeleteUserResponseContainer> {
	return fetcher<DeleteUserOkResponse, unknown, unknown>({
		url: `/user/${props.username}`,
		method: 'DELETE',
		...props,
	});
}

export type DeleteUserMutationProps<T extends keyof DeleteUserProps> = Omit<DeleteUserProps, T> &
	Partial<Pick<DeleteUserProps, T>>;

/**
 * This can only be done by the logged in user.
 */
export function useDeleteUserMutation<T extends keyof DeleteUserProps>(
	props: Pick<Partial<DeleteUserProps>, T>,
	options?: Omit<
		UseMutationOptions<
			DeleteUserResponseContainer,
			DeleteUserErrorResponse,
			DeleteUserMutationProps<T>
		>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<
		DeleteUserResponseContainer,
		DeleteUserErrorResponse,
		DeleteUserMutationProps<T>
	>(
		(mutateProps: DeleteUserMutationProps<T>) =>
			deleteUser({ ...props, ...mutateProps } as DeleteUserProps),
		options,
	);
}
