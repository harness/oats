# React Query Plugin

Plugin for `oats` cli, for generating react query hooks. This will generate hooks
using `react-query`.

## Installation

Using NPM:

```
npm i -D @harnessio/oats-cli @harnessio/oats-plugin-react-query
```

Using Yarn:

```
yarn add -D @harnessio/oats-cli @harnessio/oats-plugin-react-query
```

## Usage

```ts
// oats.config.ts
import { defineConfig } from '@harnessio/oats-cli/config';
import reactQueryPlugin from '@harnessio/oats-plugin-react-query';

export default defineConfig({
  plugins: [
    reactQueryPlugin({
      /**
       * Path to file which exports a custom fetcher/query function
       * This field is optional.
       *
       * See "Custom Fetcher" for more details
       */
      customFetcher: '../realtive/path/to/custom/fetcher',
      /**
       * Override options per operation.
       * The key must the operation Id from the spec.
       * This field is optional.
       */
      overrides: {
        operationId: {
          /**
           * By default, if the method is `GET`, `useQuery` is used
           * else, `useMutation` is used. This might not be the desired output
           * always and this option can be used to override the behaviour.
           *
           * If this is set to `true`, no matter what the method is, `useQuery`
           * will always to used.
           */
          useQuery: true,
        },
      },
    }),
  ],
});
```

## Custom Fetcher

This plugins generates a basic fetcher for you, but this might not useful in the
real world. You can provide your own fetcher function which handles your use-cases.

You can configure this using the `customFetcher` config. It should be a string
pointing to the file with custom fetcher. The file must export a function
named `fetcher` and an interface `FetcherOptions` with the following signature:

```ts
export interface FetcherOptions<TQueryParams = never, TBody = never>
  extends Omit<RequestInit, 'body'> {
  url: string;
  queryParams?: TQueryParams extends never ? undefined : TQueryParams;
  body?: TBody extends never ? undefined : TBody;
}

export function fetcher<TResponse = unknown, TQueryParams = never, TBody = never>(
  options: FetcherOptions<TQueryParams, TBody>,
): Promise<TResponse> {
  // your code here
}
```

You can add additional properties to `FetcherOptions` as per your requirements,
as these additional properties will be passed through from the hook to the fetcher.

You can take a look at the [default fetcher generated here](../../examples/output/petstore-openapi-v3.0/hooks/fetcher.ts)
