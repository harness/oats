/* eslint-disable */
// This code is autogenerated using @harnessio/oats CLI.
// Please do not modify this code directly.
import type { StackTraceElement } from '../schemas/StackTraceElement';

export interface Throwable {
	cause?: Throwable;
	localizedMessage?: string;
	message?: string;
	stackTrace?: StackTraceElement[];
	suppressed?: Throwable[];
}
