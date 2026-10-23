---
'@harnessio/oats-cli': minor
'@harnessio/oats-plugin-react-query': minor
---

Add support for Server-Sent Events (SSE).

Operations whose successful response is declared with a `text/event-stream`
content type in the OpenAPI spec now generate a dedicated subscription hook
instead of a `useQuery`/`useMutation` hook.

- `@harnessio/oats-cli` now resolves the schema for `text/event-stream`
  responses (previously only `application/json`, `*/*` and
  `application/octet-stream` were recognized), and exposes
  `isEventStreamOperation`/`isEventStreamResponse` helpers for plugin authors.
- `@harnessio/oats-plugin-react-query` generates, for each SSE operation, a
  `fetch` + `ReadableStream` based subscriber (`hooks/eventStreamFetcher.ts`,
  customizable via the new `customEventStreamFetcher` config option) along
  with a `use<OperationName>EventStream` React hook that connects on mount,
  exposes `{ data, event, status, error, close }`, and reconnects whenever
  any path, query, or header param changes (or cleans up on unmount / when
  `enabled` is set to `false`). `EventSource` is intentionally not used,
  since it cannot send custom request headers (e.g. auth headers).
- Non-2xx responses are parsed as the operation's declared error response
  type where possible (falling back to a generic `Error`), and passed to
  `onError`/exposed via `error` with that type.
- The generated hook accepts an optional `retry` option to automatically
  reconnect (with exponential backoff) after an unexpected stream error.
- The generated hook also accepts an optional `syncQueryKey` (and
  `syncQueryData`) option, which writes every received message into the
  `@tanstack/react-query` cache at that key via `queryClient.setQueryData`,
  so an existing `useQuery` hook reading the same resource stays live-updated
  without any extra wiring.

`@harnessio/oats-plugin-react-query-harness` intentionally does **not** get
this feature: it now silently skips SSE operations (rather than erroring),
so consumers who need SSE hooks for a harness-based service can add
`@harnessio/oats-plugin-react-query` alongside it in the same service,
scoped via `allowedOperationIds` - see that package's README. Duplicating
the SSE codegen across both plugins isn't worth the long-term maintenance
cost given it doesn't interact with `scopeGroups` at all.
