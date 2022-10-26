export interface OverrideOptions {
	useQuery?: boolean;
}

export interface Config {
	customFetcher?: string;
	overrides?: Record<string, OverrideOptions>;
}
