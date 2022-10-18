/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import type { Order } from '../schemas/Order';
import { fetcher, FetcherOptions } from './fetcher';

export interface UseGetOrderByIdQueryPathParams {
	/**
	 * @format int64
	 */
	orderId: number;
}

export type GetOrderByIdResponse = Order;

export type GetOrderByIdError = unknown;

export interface GetOrderByIdProps
	extends UseGetOrderByIdQueryPathParams,
		Omit<FetcherOptions<unknown, unknown>, 'url'> {}

export function getOrderById(props: GetOrderByIdProps): Promise<GetOrderByIdResponse> {
	const { orderId, ...rest } = props;

	return fetcher<GetOrderByIdResponse, unknown, unknown>({
		url: `/store/order/${orderId}`,
		method: 'GET',
		...rest,
	});
}

/**
 * For valid response try integer IDs with value >= 1 and <= 10. Other values will generated exceptions
 */
export function useGetOrderByIdQuery(
	props: GetOrderByIdProps,
	options: Omit<UseQueryOptions<GetOrderByIdResponse, GetOrderByIdError>, 'queryKey' | 'queryFn'>,
) {
	return useQuery<GetOrderByIdResponse, GetOrderByIdError>(
		['getOrderById'],
		({ signal }) => getOrderById({ ...props, signal }),
		options,
	);
}
