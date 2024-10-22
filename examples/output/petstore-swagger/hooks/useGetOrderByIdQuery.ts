/* This is a sample header */
/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import type { Order } from '../schemas/Order';
import { fetcher, FetcherOptions } from './fetcher';

export interface GetOrderByIdQueryPathParams {
	/**
	 * @format int64
	 */
	orderId: number;
}

export type GetOrderByIdOkResponse = Order;

export type GetOrderByIdErrorResponse = unknown;

export interface GetOrderByIdProps
	extends GetOrderByIdQueryPathParams,
		Omit<FetcherOptions<unknown, unknown>, 'url'> {}

export interface GetOrderByIdResponseContainer {
	content: GetOrderByIdOkResponse;
	headers: Record<string, any>;
}

export function getOrderById(props: GetOrderByIdProps): Promise<GetOrderByIdResponseContainer> {
	return fetcher<GetOrderByIdOkResponse, unknown, unknown>({
		url: `/store/order/${props.orderId}`,
		method: 'GET',
		...props,
	});
}

/**
 * For valid response try integer IDs with value >= 1 and <= 10. Other values will generated exceptions
 */
export function useGetOrderByIdQuery(
	props: GetOrderByIdProps,
	options?: Omit<
		UseQueryOptions<GetOrderByIdResponseContainer, GetOrderByIdErrorResponse>,
		'queryKey' | 'queryFn'
	>,
) {
	return useQuery<GetOrderByIdResponseContainer, GetOrderByIdErrorResponse>(
		['getOrderById', props.orderId],
		({ signal }) => getOrderById({ ...props, signal }),
		options,
	);
}
