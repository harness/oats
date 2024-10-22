/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import { fetcher, FetcherOptions } from './fetcher';

export interface DeleteOrderMutationPathParams {
	/**
	 * @format int64
	 */
	orderId: number;
}

export type DeleteOrderOkResponse = unknown;

export type DeleteOrderErrorResponse = unknown;

export interface DeleteOrderProps
	extends DeleteOrderMutationPathParams,
		Omit<FetcherOptions<unknown, unknown>, 'url'> {}

export interface DeleteOrderResponseContainer {
	content: DeleteOrderOkResponse;
	headers: Record<string, any>;
}

export function deleteOrder(props: DeleteOrderProps): Promise<DeleteOrderResponseContainer> {
	return fetcher<DeleteOrderOkResponse, unknown, unknown>({
		url: `/store/order/${props.orderId}`,
		method: 'DELETE',
		...props,
	});
}

export type DeleteOrderMutationProps<T extends keyof DeleteOrderProps> = Omit<DeleteOrderProps, T> &
	Partial<Pick<DeleteOrderProps, T>>;

/**
 * For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 */
export function useDeleteOrderMutation<T extends keyof DeleteOrderProps>(
	props: Pick<Partial<DeleteOrderProps>, T>,
	options?: Omit<
		UseMutationOptions<
			DeleteOrderResponseContainer,
			DeleteOrderErrorResponse,
			DeleteOrderMutationProps<T>
		>,
		'mutationKey' | 'mutationFn'
	>,
) {
	return useMutation<
		DeleteOrderResponseContainer,
		DeleteOrderErrorResponse,
		DeleteOrderMutationProps<T>
	>(
		(mutateProps: DeleteOrderMutationProps<T>) =>
			deleteOrder({ ...props, ...mutateProps } as DeleteOrderProps),
		options,
	);
}
