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

export function addPet(props: AddPetProps): Promise<AddPetOkResponse> {
	const { ...rest } = props;

	return fetcher<AddPetOkResponse, unknown, AddPetRequestBody>({
		url: `/pet`,
		method: 'POST',
		...rest,
	});
}

/**
 * Add a new pet to the store
 */
export function useAddPetMutation(
	props: AddPetProps,
	options: Omit<
		UseMutationOptions<AddPetOkResponse, AddPetErrorResponse>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<AddPetOkResponse, AddPetErrorResponse>(() => addPet(props), options);
}
