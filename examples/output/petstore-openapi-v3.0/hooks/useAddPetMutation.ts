/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import type { Pet } from '../schemas/Pet';
import { fetcher, FetcherOptions } from './fetcher';

export type AddPetRequestBody = Pet;

export type AddPetOkResponse = Pet;

export type AddPetErrorResponse = unknown;

export interface AddPetProps extends Omit<FetcherOptions<unknown, AddPetRequestBody>, 'url'> {
	body: AddPetRequestBody;
}

export interface AddPetResponseContainer {
	body: AddPetOkResponse;
	headers: Headers;
}

export function addPet(props: AddPetProps): Promise<AddPetResponseContainer> {
	return fetcher<AddPetOkResponse, unknown, AddPetRequestBody>({
		url: `/pet`,
		method: 'POST',
		...props,
	});
}

export type AddPetMutationProps<T extends keyof AddPetProps> = Omit<AddPetProps, T> &
	Partial<Pick<AddPetProps, T>>;

/**
 * Add a new pet to the store
 */
export function useAddPetMutation<T extends keyof AddPetProps>(
	props: Pick<Partial<AddPetProps>, T>,
	options?: Omit<
		UseMutationOptions<AddPetResponseContainer, AddPetErrorResponse, AddPetMutationProps<T>>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<AddPetResponseContainer, AddPetErrorResponse, AddPetMutationProps<T>>(
		(mutateProps: AddPetMutationProps<T>) => addPet({ ...props, ...mutateProps } as AddPetProps),
		options,
	);
}
