/* eslint-disable */
// This code is autogenerated using @harnessio/oats CLI.
// Please do not modify this code directly.
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import type { ResponseServicesV2YamlMetadataDto } from '../schemas/ResponseServicesV2YamlMetadataDto';
import type { Failure } from '../schemas/Failure';
import type { Error } from '../schemas/Error';
import type { ServicesYamlMetadataApiInput } from '../schemas/ServicesYamlMetadataApiInput';
import { fetcher, FetcherOptions } from 'services/fetcher';

export interface GetServicesYamlAndRuntimeInputsQueryQueryParams {
	accountIdentifier: string;
	orgIdentifier?: string;
	projectIdentifier?: string;
}

export type GetServicesYamlAndRuntimeInputsRequestBody = ServicesYamlMetadataApiInput;

export type GetServicesYamlAndRuntimeInputsOkResponse = ResponseServicesV2YamlMetadataDto;

export type GetServicesYamlAndRuntimeInputsErrorResponse = Failure | Error;

export interface GetServicesYamlAndRuntimeInputsProps
	extends Omit<
		FetcherOptions<
			GetServicesYamlAndRuntimeInputsQueryQueryParams,
			GetServicesYamlAndRuntimeInputsRequestBody
		>,
		'url'
	> {
	queryParams: GetServicesYamlAndRuntimeInputsQueryQueryParams;
	body: GetServicesYamlAndRuntimeInputsRequestBody;
}

export function getServicesYamlAndRuntimeInputs(
	props: GetServicesYamlAndRuntimeInputsProps,
): Promise<GetServicesYamlAndRuntimeInputsOkResponse> {
	const { ...rest } = props;

	return fetcher<
		GetServicesYamlAndRuntimeInputsOkResponse,
		GetServicesYamlAndRuntimeInputsQueryQueryParams,
		GetServicesYamlAndRuntimeInputsRequestBody
	>({
		url: `/servicesV2/servicesYamlMetadata`,
		method: 'POST',
		...rest,
	});
}

/**
 *
 */
export function useGetServicesYamlAndRuntimeInputsQuery(
	props: GetServicesYamlAndRuntimeInputsProps,
	options?: Omit<
		UseQueryOptions<
			GetServicesYamlAndRuntimeInputsOkResponse,
			GetServicesYamlAndRuntimeInputsErrorResponse
		>,
		'queryKey' | 'queryFn'
	>,
) {
	return useQuery<
		GetServicesYamlAndRuntimeInputsOkResponse,
		GetServicesYamlAndRuntimeInputsErrorResponse
	>(
		['getServicesYamlAndRuntimeInputs', props.queryParams, props.body],
		({ signal }) => getServicesYamlAndRuntimeInputs({ ...props, signal }),
		options,
	);
}
