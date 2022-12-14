/* This is a sample header */
/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import { fetcher, FetcherOptions } from './fetcher';

export interface DeletePetMutationPathParams {
	/**
	 * @format int64
	 */
	petId: number;
}

export type DeletePetOkResponse = unknown;

export type DeletePetErrorResponse = unknown;

export interface DeletePetProps
	extends DeletePetMutationPathParams,
		Omit<FetcherOptions<unknown, unknown>, 'url'> {}

export function deletePet(props: DeletePetProps): Promise<DeletePetOkResponse> {
	return fetcher<DeletePetOkResponse, unknown, unknown>({
		url: `/pet/${props.petId}`,
		method: 'DELETE',
		...props,
	});
}

export type DeletePetMutationProps<T extends keyof DeletePetProps> = Omit<DeletePetProps, T> &
	Partial<Pick<DeletePetProps, T>>;

/**
 *
 */
export function useDeletePetMutation<T extends keyof DeletePetProps>(
	props: Pick<Partial<DeletePetProps>, T>,
	options?: Omit<
		UseMutationOptions<DeletePetOkResponse, DeletePetErrorResponse, DeletePetMutationProps<T>>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<DeletePetOkResponse, DeletePetErrorResponse, DeletePetMutationProps<T>>(
		(mutateProps: DeletePetMutationProps<T>) =>
			deletePet({ ...props, ...mutateProps } as DeletePetProps),
		options,
	);
}
