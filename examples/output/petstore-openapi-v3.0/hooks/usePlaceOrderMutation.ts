/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import type { Order } from '../schemas/Order';
import { fetcher, FetcherOptions } from './fetcher';

export type PlaceOrderRequestBody = Order;

export type PlaceOrderOkResponse = Order;

export type PlaceOrderErrorResponse = unknown;

export interface PlaceOrderProps
	extends Omit<FetcherOptions<unknown, PlaceOrderRequestBody>, 'url'> {
	body: PlaceOrderRequestBody;
}

export interface PlaceOrderResponseContainer {
	content: PlaceOrderOkResponse;
	headers: Record<string, any>;
}

export function placeOrder(props: PlaceOrderProps): Promise<PlaceOrderResponseContainer> {
	return fetcher<PlaceOrderOkResponse, unknown, PlaceOrderRequestBody>({
		url: `/store/order`,
		method: 'POST',
		...props,
	});
}

export type PlaceOrderMutationProps<T extends keyof PlaceOrderProps> = Omit<PlaceOrderProps, T> &
	Partial<Pick<PlaceOrderProps, T>>;

/**
 * Place a new order in the store
 */
export function usePlaceOrderMutation<T extends keyof PlaceOrderProps>(
	props: Pick<Partial<PlaceOrderProps>, T>,
	options?: Omit<
		UseMutationOptions<
			PlaceOrderResponseContainer,
			PlaceOrderErrorResponse,
			PlaceOrderMutationProps<T>
		>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<
		PlaceOrderResponseContainer,
		PlaceOrderErrorResponse,
		PlaceOrderMutationProps<T>
	>(
		(mutateProps: PlaceOrderMutationProps<T>) =>
			placeOrder({ ...props, ...mutateProps } as PlaceOrderProps),
		options,
	);
}
