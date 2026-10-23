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
       * Path pointing to the file where a custom Server-Sent Events (SSE)
       * subscriber resides. Used for operations whose response is declared
       * as `text/event-stream`. See the "Server-Sent Events (SSE)" section
       * below. Optional - a default subscriber is generated when omitted.
       */
      customEventStreamFetcher: '../realtive/path/to/custom/event-stream-fetcher',
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

## Server-Sent Events (SSE)

If an operation's successful response is declared with a `text/event-stream`
content type in your OpenAPI spec, this plugin generates a dedicated
subscription hook instead of a `useQuery`/`useMutation` hook:

```yaml
responses:
  '200':
    description: An event stream of OnboardingResponse.
    content:
      text/event-stream:
        schema:
          $ref: '#/components/schemas/OnboardingResponse'
```

This generates a `use<OperationName>EventStream` hook, e.g.:

```tsx
const { data, event, status, error, close } = useStreamVibeOnboardingEventsEventStream(
  { spaceId, appId, onboardingId },
  { onMessage: (data) => console.log(data) },
);
```

- `status` is one of `'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed' | 'error'`.
- `data` holds the payload of the most recent event. `error` holds the
  parsed error response (matching the operation's declared error schema)
  when available, or a generic `Error` otherwise.
- The connection (re)connects on mount and whenever any path, query, or
  header param changes, and closes automatically on unmount or when
  `enabled` is set to `false`. You can also close it manually by calling
  `close()`.
- Pass `retry: true` (or `{ maxAttempts, delayMs }`) to automatically
  reconnect with exponential backoff after an unexpected error (a dropped
  connection or non-2xx response). This does not apply when the server
  closes the stream normally.

Internally, this uses `fetch` and a streamed `ReadableStream` reader rather
than the browser's `EventSource` API, because `EventSource` cannot send
custom request headers (e.g. auth headers), which most APIs require.

### Keeping a `useQuery` cache entry live

If you also have a regular `useQuery` hook reading the same resource (e.g.
`useGetVibeOnboardingQuery`), you can keep its cached data updated in
real-time from the stream, instead of (or in addition to) reading `data` off
of the event stream hook directly. Pass `syncQueryKey` with the exact same
query key your `useQuery` hook uses (its first argument is always the
operation id, followed by the path/query params):

```tsx
useStreamVibeOnboardingEventsEventStream(
  { spaceId, appId, onboardingId },
  {
    syncQueryKey: ['getVibeOnboarding', spaceId, appId, onboardingId],
  },
);
```

Every message received on the stream is written into the
`@tanstack/react-query` cache at `syncQueryKey` via `queryClient.setQueryData`,
so any component using `useGetVibeOnboardingQuery` for that same resource
re-renders with the live data automatically - no need for it to know SSE is
involved at all.

By default, the value is stored the same way `useQuery` hooks generated by
this plugin store their data: `{ body: <message data>, headers: new Headers() }`.
Pass `syncQueryData` to customize this transform.

Just like the regular fetcher, a default subscriber is generated for you at
`hooks/eventStreamFetcher.ts`. You can provide your own by pointing the
`customEventStreamFetcher` config option to a file exporting a
`subscribeToEventStream` function and `EventStreamOptions`/`EventStreamHandlers`
types with the same signatures as the
[default implementation](./src/templates/eventStreamFetcher.liquid).
