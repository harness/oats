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

export interface UploadFileMutationQueryParams {
	additionalMetadata?: string;
}

export type UploadFileRequestBody = string;

export type UploadFileOkResponse = ApiResponse;

export type UploadFileErrorResponse = unknown;

export interface UploadFileProps
	extends UploadFileMutationPathParams,
		Omit<FetcherOptions<UploadFileMutationQueryParams, UploadFileRequestBody>, 'url'> {
	queryParams: UploadFileMutationQueryParams;
	body: UploadFileRequestBody;
}

export function uploadFile(props: UploadFileProps): Promise<UploadFileOkResponse> {
	return fetcher<UploadFileOkResponse, UploadFileMutationQueryParams, UploadFileRequestBody>({
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
		UseMutationOptions<UploadFileOkResponse, UploadFileErrorResponse, UploadFileMutationProps<T>>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<UploadFileOkResponse, UploadFileErrorResponse, UploadFileMutationProps<T>>(
		(mutateProps: UploadFileMutationProps<T>) =>
			uploadFile({ ...props, ...mutateProps } as UploadFileProps),
		options,
	);
}
