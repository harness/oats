/* This is a sample header */
/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import type { PetRequestBody } from '../requestBodies/PetRequestBody';
import { fetcher, FetcherOptions } from './fetcher';

export type UpdatePetRequestBody = PetRequestBody;

export type UpdatePetOkResponse = unknown;

export type UpdatePetErrorResponse = unknown;

export interface UpdatePetProps extends Omit<FetcherOptions<unknown, UpdatePetRequestBody>, 'url'> {
	body: UpdatePetRequestBody;
}

export function updatePet(props: UpdatePetProps): Promise<UpdatePetOkResponse> {
	const { ...rest } = props;

	return fetcher<UpdatePetOkResponse, unknown, UpdatePetRequestBody>({
		url: `/pet`,
		method: 'PUT',
		...rest,
	});
}

/**
 *
 */
export function useUpdatePetMutation(
	props: UpdatePetProps,
	options?: Omit<
		UseMutationOptions<UpdatePetOkResponse, UpdatePetErrorResponse>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<UpdatePetOkResponse, UpdatePetErrorResponse>(() => updatePet(props), options);
}
