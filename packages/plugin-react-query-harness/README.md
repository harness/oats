# React Query Plugin

![@harnessio/oats-plugin-react-query](https://img.shields.io/npm/v/@harnessio/oats-plugin-react-query.svg?style=flat-square)

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
       * Path poiniting to the file where the custom fetcher resides.
       * This path will be used as is, while generating the hooks.
       *
       * This path must be a relative path which can be resolved with respect
       * to a file within the hooks folder.
       */
      customFetcher: '../realtive/path/to/custom/fetcher',
      /**
       * An allow-list, for filtering out operation IDs which are to be generated.
       *
       * When defined, hooks will be generated only for the operation IDs
       * defined in this list.
       *
       * This field is optional.
       */
      allowedOperationIds: [],
      /**
       * Override options per operation.
       * The key must the operation Id from the spec.
       * This field is optional.
       */
      overrides: {
        operationId: {
          /**
           * By default, any operation expect "GET", will generate a mutation
           * hook using `useMutation`. This option can be used to overide this
           * behaviour for a given operation ID.
           *
           * When set to `true`, no matter what the verb, query hook will be
           * generated using `useQuery`.
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
