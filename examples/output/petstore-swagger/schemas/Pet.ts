/* eslint-disable */
// This code is autogenerated using @harnessio/oats-cli.
// Please do not modify this code directly.
import type { Category } from '../schemas/Category';
import type { Tag } from '../schemas/Tag';

export interface Pet {
	category?: Category;
	/**
	 * @format int64
	 */
	id?: number;
	/**
	 * @example "doggie"
	 */
	name: string;
	photoUrls: string[];
	/**
	 * pet status in the store
	 */
	status?: 'available' | 'pending' | 'sold';
	tags?: Tag[];
}
