import { useEffect, useState } from "react";

/**
 * Configuration options for {@link useDebounce}.
 *
 * @typeParam T - The type of the value being debounced.
 */
interface UseDebounceOptions<T> {
    /** The live, fast-changing value to debounce (e.g. a controlled input's value). */
    value: T;
    /** Delay in milliseconds to wait after the last change before updating the debounced value. */
    delay: number;
}

/**
 * Returns a debounced copy of `value` that only updates once `value` has
 * stopped changing for `delay` milliseconds.
 *
 * Each time `value` (or `delay`) changes, the pending timeout from the
 * previous render is cleared and a new one is scheduled — so rapid updates
 * (e.g. keystrokes) only ever result in a single state update, `delay` ms
 * after the last one stops.
 *
 * @typeParam T - The type of the value being debounced.
 *
 * @param options - See {@link UseDebounceOptions}.
 * @returns The debounced value. On first render, this is `value` itself
 * (no initial delay) — debouncing only kicks in on subsequent changes.
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce({ value: search, delay: 300 });
 *
 * useEffect(() => {
 *   if (debouncedSearch) fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 *
 * <input value={search} onChange={(e) => setSearch(e.target.value)} />
 * ```
 *
 * @remarks
 * This hook returns the value directly rather than an object — there's
 * nothing else to expose (no imperative actions, no extra state), so a
 * wrapper return type would add a layer of indirection with no benefit.
 *
 * If `delay` changes while a debounce is already pending, the pending timer
 * is discarded and a full new `delay` is scheduled from that point — the
 * remaining time on the old timer is not preserved or prorated.
 */
export default function useDebounce<T>({ value, delay }: UseDebounceOptions<T>): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handlerId = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handlerId);
    }, [value, delay]);

    return debouncedValue;
}