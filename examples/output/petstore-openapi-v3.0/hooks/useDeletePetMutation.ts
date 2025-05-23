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

export interface DeletePetMutationHeaderParams {
	api_key?: string;
}

export type DeletePetOkResponse = unknown;

export type DeletePetErrorResponse = unknown;

export interface DeletePetProps
	extends DeletePetMutationPathParams,
		Omit<FetcherOptions<unknown, unknown, DeletePetMutationHeaderParams>, 'url'> {}

export interface DeletePetResponseContainer {
	body: DeletePetOkResponse;
	headers: Headers;
}

export function deletePet(props: DeletePetProps): Promise<DeletePetResponseContainer> {
	return fetcher<DeletePetOkResponse, unknown, unknown, DeletePetMutationHeaderParams>({
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
		UseMutationOptions<
			DeletePetResponseContainer,
			DeletePetErrorResponse,
			DeletePetMutationProps<T>
		>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<DeletePetResponseContainer, DeletePetErrorResponse, DeletePetMutationProps<T>>(
		(mutateProps: DeletePetMutationProps<T>) =>
			deletePet({ ...props, ...mutateProps } as DeletePetProps),
		options,
	);
}
