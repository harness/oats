/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import type { Address } from '../schemas/Address';

export interface Customer {
	address?: Address[];
	/**
	 * @format int64
	 * @example 100000
	 */
	id?: number;
	/**
	 * @example "fehguy"
	 */
	username?: string;
}