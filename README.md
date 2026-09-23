# everyapp-hooks

A small collection of typed React hooks for everyday UI work: outside clicks, scroll locking, URL query params, `localStorage`, debouncing, first-render detection, and multistep forms.

- Written in TypeScript, types included
- No runtime dependencies (React is a peer dependency)
- Ships ESM and CommonJS builds

## Installation

```bash
npm install everyapp-hooks
# or
yarn add everyapp-hooks
# or
pnpm add everyapp-hooks
```

### Requirements

| Requirement | Version |
| ----------- | ------- |
| React       | `>=19`  |

All hooks use browser APIs (`window`, `document`, `IntersectionObserver`, …). In Next.js or any other SSR framework, use them only inside Client Components (`"use client"`).

## Usage

```tsx
import { useOnlineStatus, useScrollLock } from "everyapp-hooks";
```

## Hooks

| Hook                                    | What it does                                                             |
| --------------------------------------- | ------------------------------------------------------------------------ |
| [`useAction`](#useaction)               | Runs a React Server Action with `onSuccess` / `onError` callbacks        |
| [`useAutoScrollTop`](#useautoscrolltop) | Scrolls the window to the top when a value (e.g. the route) changes      |
| [`useDebounce`](#usedebounce)           | Delays updating a value until it stops changing (search inputs, filters) |
| [`useInView`](#useinview)               | Tells you whether an element is visible in the viewport                  |
| [`useIsFirstRender`](#useisfirstrender) | Returns `true` only on the first render, `false` afterward               |
| [`useLocalStorage`](#uselocalstorage)   | State that is persisted to `localStorage` and synced across tabs         |
| [`useMultistepForm`](#usemultistepform) | Step navigation for wizards and multistep forms                          |
| [`useOnlineStatus`](#useonlinestatus)   | Tracks whether the browser is online                                     |
| [`useOutsideEvent`](#useoutsideevent)   | Runs a callback when an event happens outside an element                 |
| [`useQueryParams`](#usequeryparams)     | Reads and updates URL query params                                       |
| [`useScrollLock`](#usescrolllock)       | Locks page scrolling (for modals, drawers, menus)                        |

---

### `useAction`

Wraps a React Server Action and calls `onSuccess` or `onError` based on the result. Built on React's `useActionState`, so it **requires React 19+**.

```ts
function useAction<T>(options: {
  serverAction: (
    prevState: ActionResponse,
    payload: T,
  ) => Promise<ActionResponse>;
  onSuccess?: (data: { message: string; [key: string]: unknown }) => void;
  onError?: (error: string) => void;
}): {
  action: (payload: T) => void;
  isPending: boolean;
};
```

Your server action must return an `ActionResponse`:

```ts
type ActionResponse =
  | { success: true; data: { message: string; [key: string]: unknown } }
  | { success: false; error: string };
```

**Example**

```tsx
"use client";
import { useAction } from "everyapp-hooks";
import { updateProfile } from "./actions";

export function ProfileForm() {
  const { action, isPending } = useAction<FormData>({
    serverAction: updateProfile,
    onSuccess: (data) => toast.success(data.message),
    onError: (error) => toast.error(error),
  });

  return (
    <form action={action}>
      <input name="name" />
      <button disabled={isPending}>{isPending ? "Saving…" : "Save"}</button>
    </form>
  );
}
```

**Notes**

- The callbacks are not called on the first render, only after the action has resolved.
- If you call `action` outside a `<form action>`, wrap the call in `startTransition` so `isPending` updates.

---

### `useAutoScrollTop`

Scrolls the window to the top whenever `trigger` changes. Typically you pass the current pathname, so page navigations in an SPA start at the top.

```ts
function useAutoScrollTop(options: {
  trigger: unknown;
  behavior?: ScrollBehavior; // "smooth" | "instant" | "auto", default "smooth"
}): void;
```

**Example**

```tsx
import { useLocation } from "react-router-dom";
import { useAutoScrollTop } from "everyapp-hooks";

function Layout({ children }) {
  const { pathname } = useLocation();
  useAutoScrollTop({ trigger: pathname, behavior: "instant" });
  return <main>{children}</main>;
}
```

---

### `useDebounce`

Returns a copy of `value` that only updates after `value` has stopped changing for `delay` milliseconds. Typical uses are search boxes, filters and auto-save, where you don't want to run a request on every keystroke.

```ts
function useDebounce<T>(options: {
  value: T;
  delay: number; // milliseconds
}): T;
```

| Option  | Type     | Description                                                             |
| ------- | -------- | ----------------------------------------------------------------------- |
| `value` | `T`      | The fast-changing value, e.g. a controlled input's value                |
| `delay` | `number` | How long `value` must stay unchanged before the debounced value updates |

**Example**

```tsx
import { useEffect, useState } from "react";
import { useDebounce } from "everyapp-hooks";

function ProductSearch() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce({ value: search, delay: 300 });

  useEffect(() => {
    if (debouncedSearch) fetchResults(debouncedSearch);
  }, [debouncedSearch]);

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search…"
    />
  );
}
```

**Notes**

- On the first render the value is returned right away. The delay only applies to later changes.
- Each change restarts the timer, so typing `r`, `re`, `react` quickly gives a single update with `"react"`.
- Changing `delay` while an update is pending starts a full new delay from that moment.
- The hook debounces a **value**, not a function. Put the side effect (like a fetch) in a `useEffect` that depends on the debounced value.
- Objects and arrays are compared by reference. Passing a new object literal on every render restarts the timer each time, so memoize them or debounce a primitive instead.

---

### `useInView`

Tracks whether an element is visible, using `IntersectionObserver`. Useful for scroll animations, lazy loading and infinite scroll.

```ts
function useInView<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit & { once?: boolean },
): {
  ref: React.RefObject<T | null>;
  inView: boolean;
};
```

| Option       | Type                          | Default  | Description                                             |
| ------------ | ----------------------------- | -------- | ------------------------------------------------------- |
| `once`       | `boolean`                     | `false`  | Stop observing after the element first becomes visible  |
| `root`       | `Element \| Document \| null` | viewport | Element used as the viewport                            |
| `rootMargin` | `string`                      | `"0px"`  | Margin around the root, e.g. `"100px"` to trigger early |
| `threshold`  | `number \| number[]`          | `0`      | How much of the element must be visible (0–1)           |

**Example**

```tsx
import { useInView } from "everyapp-hooks";

function FadeIn({ children }) {
  const { ref, inView } = useInView<HTMLDivElement>({
    threshold: 0.3,
    once: true,
  });

  return (
    <div ref={ref} className={inView ? "fade-in" : "invisible"}>
      {children}
    </div>
  );
}
```

---

### `useIsFirstRender`

Returns `true` only during a component's very first render, and `false` on every render after that. Useful for skipping an effect's initial run, or for distinguishing "component just mounted" from "props/state changed."

```ts
function useIsFirstRender(): boolean;
```

The flip to `false` happens inside `useEffect` (after the first render commits), so it is safe under concurrent rendering — a render that gets discarded before committing won't incorrectly consume the "first render" flag.

**Example**

```tsx
import { useEffect, useState } from "react";
import { useIsFirstRender } from "everyapp-hooks";

function UserSearch({ query }: { query: string }) {
  const isFirstRender = useIsFirstRender();

  useEffect(() => {
    if (isFirstRender) return; // skip the fetch on mount
    fetchResults(query);
  }, [query]);

  return <p>Searching for: {query}</p>;
}
```

**Notes**

- The value is `true` during the first render and flips to `false` after that render commits. It stays `false` for the lifetime of the component.
- Because the flag lives in a `ref`, reading it doesn't trigger extra renders.
- Each component instance tracks its own first render independently.

---

### `useLocalStorage`

State that is saved in `localStorage`. Values are stored as JSON, so any JSON-serializable value works. It also updates when the same key is changed in another browser tab.

```ts
function useLocalStorage<T>(options: { key: string; initialValue: T }): {
  value: T;
  writeValue: (newValue: T) => void;
};
```

**Example**

```tsx
import { useLocalStorage } from "everyapp-hooks";

function ThemeToggle() {
  const { value: theme, writeValue: setTheme } = useLocalStorage<
    "light" | "dark"
  >({
    key: "theme",
    initialValue: "light",
  });

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Current theme: {theme}
    </button>
  );
}
```

**Notes**

- If `localStorage` is unavailable or contains invalid JSON, `initialValue` is used and a warning is logged. Nothing is thrown.
- If a write fails (for example, the storage quota is full), the value is updated and a warning is logged.
- `writeValue` takes a value, not an updater function.

---

### `useMultistepForm`

Manages which step of a wizard is active. It only handles navigation. It doesn't store form data or render anything, so you can use it with any form library.

```ts
function useMultistepForm<T>(options: { steps: T[] }): {
  currentStep: T;
  currentStepIndex: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
};
```

All navigation is clamped to valid bounds: `nextStep()` on the last step, `prevStep()` on the first step, and `goToStep(99)` are all safe.

**Example**

```tsx
import { useMultistepForm } from "everyapp-hooks";

function SignupWizard() {
  const {
    currentStep,
    currentStepIndex,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
  } = useMultistepForm({
    steps: [<AccountStep />, <AddressStep />, <ReviewStep />],
  });

  return (
    <form>
      <p>Step {currentStepIndex + 1} of 3</p>
      {currentStep}

      <button type="button" onClick={prevStep} disabled={isFirstStep}>
        Back
      </button>
      {isLastStep ? (
        <button type="submit">Submit</button>
      ) : (
        <button type="button" onClick={nextStep}>
          Next
        </button>
      )}
    </form>
  );
}
```

Steps can be any value (components, strings, config objects), not only JSX.

---

### `useOnlineStatus`

Returns `true` when the browser is online and `false` when it's offline. Updates automatically on the `online` / `offline` events.

```ts
function useOnlineStatus(): boolean;
```

**Example**

```tsx
import { useOnlineStatus } from "everyapp-hooks";

function ConnectionBadge() {
  const isOnline = useOnlineStatus();
  return <span>{isOnline ? "Online" : "Offline"}</span>;
}
```

`navigator.onLine` only shows whether the device has a network connection. It can't tell whether a specific server is reachable.

---

### `useOutsideEvent`

Calls `callback` when an event happens outside the element referenced by `ref`. The default event is `mousedown`, which is ideal for closing dropdowns, popovers and modals.

```ts
function useOutsideEvent<T extends HTMLElement = HTMLElement>(options: {
  ref: React.RefObject<T>;
  callback: () => void;
  eventType?: keyof DocumentEventMap; // default "mousedown"
}): React.RefObject<T>;
```

**Example**

```tsx
import { useCallback, useRef, useState } from "react";
import { useOutsideEvent } from "everyapp-hooks";

function Dropdown() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null!);
  const close = useCallback(() => setOpen(false), []);

  useOutsideEvent({ ref: menuRef, callback: close });

  return (
    <div ref={menuRef}>
      <button onClick={() => setOpen((o) => !o)}>Menu</button>
      {open && <ul>…</ul>}
    </div>
  );
}
```

**Notes**

- Wrap `callback` in `useCallback`. Otherwise the listener is removed and re-added on every render.
- Use `eventType: "touchstart"` for touch devices or `"focusin"` for keyboard focus.

---

### `useQueryParams`

Reads and updates the URL's query string using `URLSearchParams`. Updates use `history.replaceState`, so they don't add browser history entries. The hook also re-syncs when the user presses Back or Forward.

```ts
function useQueryParams(): {
  getParam: (param: string) => string | null;
  getQueryString: () => string;
  setParam: (param: string, value: string) => void;
  setOnlyParam: (param: string, value: string) => void;
  setMultipleParams: (params: Record<string, string>) => void;
  removeParam: (param: string) => void;
  removeMultipleParams: (params: string[]) => void;
  resetParams: () => void;
};
```

| Method                        | Behavior                                       | `page` handling                                              |
| ----------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `getParam(name)`              | Returns the value, or `null` if missing        | —                                                            |
| `getQueryString()`            | Returns the query string without a leading `?` | —                                                            |
| `setParam(name, value)`       | Sets one param and keeps the others            | Resets `page` to `1` if it exists, unless `name` is `"page"` |
| `setOnlyParam(name, value)`   | Replaces the whole query with this one param   | Resets `page` to `1` if it exists, unless `name` is `"page"` |
| `setMultipleParams(obj)`      | Sets several params and keeps the others       | Resets `page` to `1` if it exists                            |
| `removeParam(name)`           | Removes one param                              | Resets `page` to `1` if it exists, unless `name` is `"page"` |
| `removeMultipleParams(names)` | Removes several params                         | Resets `page` to `1` if it exists                            |
| `resetParams()`               | Clears all params                              | Removed                                                      |

The `page` reset is intentional: when filters or sorting change, users go back to the first page of results.

**Example**

```tsx
import { useQueryParams } from "everyapp-hooks";

function ProductFilters() {
  const { getParam, setParam, setMultipleParams, resetParams } =
    useQueryParams();
  const sort = getParam("sort") ?? "newest";

  return (
    <>
      <select value={sort} onChange={(e) => setParam("sort", e.target.value)}>
        <option value="newest">Newest</option>
        <option value="price">Price</option>
      </select>

      <button
        onClick={() => setMultipleParams({ category: "shoes", color: "black" })}
      >
        Black shoes
      </button>

      <button onClick={resetParams}>Clear filters</button>
    </>
  );
}
```

**Notes**

- The URL is updated right after React re-renders. Read values with `getParam` rather than `window.location`.
- If you use a router that manages the URL (React Router, Next.js), prefer that router's own search-params API. Mixing the two can cause them to get out of sync.

---

### `useScrollLock`

Prevents the page from scrolling while `isLocked` is `true`. It adds right padding the width of the scrollbar, so the layout doesn't shift when the scrollbar disappears. The original styles are restored when the lock is released or the component unmounts.

```ts
function useScrollLock(isLocked?: boolean): void; // default true
```

**Example**

```tsx
import { useScrollLock } from "everyapp-hooks";

function Modal({ isOpen, children }) {
  useScrollLock(isOpen);
  if (!isOpen) return null;
  return <div className="modal">{children}</div>;
}
```

You can also call `useScrollLock()` with no argument inside a component that is only rendered while open.

---

## TypeScript

Every hook is fully typed, and generic hooks infer their types from your arguments:

```ts
const { value } = useLocalStorage({ key: "count", initialValue: 0 }); // value: number
const { ref } = useInView<HTMLImageElement>(); // ref: RefObject<HTMLImageElement | null>
```

## Development

```bash
npm install
npm run build          # build to dist/ with tsup
npm run dev            # build in watch mode
npm test               # run the Jest + React Testing Library suite
npm run test:coverage  # tests with coverage report
```

## License

ISC © Ebram Barsoum
