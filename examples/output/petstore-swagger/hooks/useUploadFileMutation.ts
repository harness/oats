/* This is a sample header */
/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import type { ApiResponse } from '../schemas/ApiResponse';
import { fetcher, FetcherOptions } from './fetcher';

export interface UploadFileMutationPathParams {
	/**
	 * @format int64
	 */
	petId: number;
}

export type UploadFileRequestBody = unknown;

export type UploadFileOkResponse = ApiResponse;

export type UploadFileErrorResponse = unknown;

export interface UploadFileProps
	extends UploadFileMutationPathParams,
		Omit<FetcherOptions<unknown, UploadFileRequestBody>, 'url'> {
	body: UploadFileRequestBody;
}

export interface UploadFileResponseContainer {
	content: UploadFileOkResponse;
	headers: Headers;
}

export function uploadFile(props: UploadFileProps): Promise<UploadFileResponseContainer> {
	return fetcher<UploadFileOkResponse, unknown, UploadFileRequestBody>({
		url: `/pet/${props.petId}/uploadImage`,
		method: 'POST',
		...props,
	});
}

export type UploadFileMutationProps<T extends keyof UploadFileProps> = Omit<UploadFileProps, T> &
	Partial<Pick<UploadFileProps, T>>;

/**
 *
 */
export function useUploadFileMutation<T extends keyof UploadFileProps>(
	props: Pick<Partial<UploadFileProps>, T>,
	options?: Omit<
		UseMutationOptions<
			UploadFileResponseContainer,
			UploadFileErrorResponse,
			UploadFileMutationProps<T>
		>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<
		UploadFileResponseContainer,
		UploadFileErrorResponse,
		UploadFileMutationProps<T>
	>(
		(mutateProps: UploadFileMutationProps<T>) =>
			uploadFile({ ...props, ...mutateProps } as UploadFileProps),
		options,
	);
}
