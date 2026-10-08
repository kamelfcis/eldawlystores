# Loading system

Doly Stores uses one progress path. There is no `nprogress`, `nextjs-toploader`, or `@bprogress/react` dependency.

## Why not @bprogress/react

`@bprogress/react` installs against Next.js 16 and React 19, and it does not use Pages Router `router.events`. It was not kept because it does not match this store:

- `@bprogress/core` trickles with `setTimeout` and `done()` jumps by a random amount. Unknown work must stay indeterminate, and uploads must use real byte counts.
- `set()` clamps to a minimum of `0.08`, so the bar cannot show an honest small percent.
- `stop()` is global. A second in-flight operation would disappear with the first.
- `useAnchorProgress` watches the whole document with a `MutationObserver` and replaces `history.pushState` so it calls `stop()`.

The top bar is a 2px fixed line. Storefront accent is retail red `#a92222`. Admin accent is carbon `#1a211e`. A short glow sits on the line only. `prefers-reduced-motion: reduce` removes the indeterminate slide and skeleton pulse; the line and the skeleton blocks stay visible.

## Architecture

`lib/loading/operations.ts` is a module store. React state for the bar lives only in `components/loading/progress-bar.tsx`, mounted once from the root layout inside `Suspense` so `useSearchParams` does not force every page to be dynamic. Layouts stay server components. The bar subscribes with `useSyncExternalStore`. Upload ticks do not rerender the page tree.

Each operation has an id. The bar becomes visible only after 100ms. It hides when the map is empty, including after an error (`finishOperation`). Determinate ratio is `sum(loaded) / sum(total)` for operations that reported a real total. If none have a total, the bar is indeterminate and has no percent.

| Duration | Feedback |
| --- | --- |
| Under 100ms | Nothing. Buttons disable immediately so a second submit cannot start. |
| 100ms to about 1s | Inline label on the control (`LoadingButton`, confirm, upload label). |
| Page navigation | Structural skeleton from `loading.tsx`, plus the top bar only while the route operation is still open. |
| File upload | `XMLHttpRequest.upload.onprogress` to the existing `POST /api/upload`. Auth and R2 stay on the server. |
| Checkout | Indeterminate until the server returns an access token. The cart clears only after that. The button stays disabled until the order route takes over. |

Route listening does not call `preventDefault` and does not touch prefetch. A capture-phase click listener ignores modified clicks, new tabs, downloads, external URLs, hash-only links, and clicks that start on `button`, `input`, `textarea`, `select`, or `[data-prevent-progress]`. `pushState` / `replaceState` start the same `route` id only when the path or query actually changes, then call through to the original history methods. The bar ends that id when `usePathname` or `useSearchParams` updates.

## TanStack Query

The query client keeps previous data with `keepPreviousData`. A background refetch must not replace a list with an empty state. Cart writes still go through `setQueryData` (optimistic local cart). Wishlist and compare keep the current products on screen while a later load runs, and a failed load clears the busy flag. Order success is never optimistic.

There is no realtime subscription on the dashboard, so nothing there waits on a socket.

## Files

- `lib/loading/operations.ts` — ids, delay, ratios
- `lib/loading/route-signals.ts` — link clicks and history, without blocking navigation
- `lib/loading/upload.ts` — admin upload progress
- `components/loading/progress-bar.tsx`
- `components/loading/loading-button.tsx`
- `components/loading/upload-progress.tsx`
- `components/loading/skeletons.tsx` — home, catalog, product, admin dashboard, admin lists
- `components/loading/use-deferred-busy.ts`
- `tests/loading-operations.test.ts`
