/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import type { ApiResponse } from '../schemas/ApiResponse';
import { fetcher, FetcherOptions } from './fetcher';

export interface UseUploadFileMutationPathParams {
	/**
	 * @format int64
	 */
	petId: number;
}

export interface UseUploadFileMutationQueryParams {
	additionalMetadata?: string;
}

export type UploadFileResponse = ApiResponse;

export type UploadFileError = unknown;

export interface UploadFileProps
	extends UseUploadFileMutationPathParams,
		Omit<FetcherOptions<UseUploadFileMutationQueryParams, unknown>, 'url'> {
	queryParams: UseUploadFileMutationQueryParams;
}

export function uploadFile(props: UploadFileProps): Promise<UploadFileResponse> {
	const { petId, ...rest } = props;

	return fetcher<UploadFileResponse, UseUploadFileMutationQueryParams, unknown>({
		url: `/pet/${petId}/uploadImage`,
		method: 'POST',
		...rest,
	});
}

/**
 *
 */
export function useUploadFileMutation(
	props: UploadFileProps,
	options: Omit<
		UseMutationOptions<UploadFileResponse, UploadFileError>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<UploadFileResponse, UploadFileError>(() => uploadFile(props), options);
}
