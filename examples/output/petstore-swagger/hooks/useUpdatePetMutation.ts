/* This is a sample header */
/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import type { PetRequestBody } from '../requestBodies/PetRequestBody';
import { fetcher, FetcherOptions } from '../../../../custom-fetcher/index.js';

export type UpdatePetRequestBody = PetRequestBody;

export type UpdatePetOkResponse = unknown;

export type UpdatePetErrorResponse = unknown;

export interface UpdatePetProps extends Omit<FetcherOptions<unknown, UpdatePetRequestBody>, 'url'> {
	body: UpdatePetRequestBody;
}

export interface UpdatePetResponseContainer {
	content: UpdatePetOkResponse;
	headers: Record<string, any>;
}

export function updatePet(props: UpdatePetProps): Promise<UpdatePetResponseContainer> {
	return fetcher<UpdatePetOkResponse, unknown, UpdatePetRequestBody>({
		url: `/pet`,
		method: 'PUT',
		...props,
	});
}

export type UpdatePetMutationProps<T extends keyof UpdatePetProps> = Omit<UpdatePetProps, T> &
	Partial<Pick<UpdatePetProps, T>>;

/**
 *
 */
export function useUpdatePetMutation<T extends keyof UpdatePetProps>(
	props: Pick<Partial<UpdatePetProps>, T>,
	options?: Omit<
		UseMutationOptions<
			UpdatePetResponseContainer,
			UpdatePetErrorResponse,
			UpdatePetMutationProps<T>
		>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<UpdatePetResponseContainer, UpdatePetErrorResponse, UpdatePetMutationProps<T>>(
		(mutateProps: UpdatePetMutationProps<T>) =>
			updatePet({ ...props, ...mutateProps } as UpdatePetProps),
		options,
	);
}
