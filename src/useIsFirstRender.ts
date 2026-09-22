import { useEffect, useRef } from "react";

/**
 * Returns `true` only during a component's very first render, and `false`
 * on every render after that. Useful for skipping an effect's initial run,
 * or for distinguishing "component just mounted" from "props/state changed."
 *
 * @remarks
 * The flip to `false` happens inside `useEffect`, after the first render
 * commits — not during render itself. This makes it safe under concurrent
 * rendering: a render that gets discarded before committing (e.g. under
 * Suspense) won't incorrectly consume the "first render" flag.
 *
 * @returns `true` on the first render only, `false` afterward
 *
 * @example
 * ```tsx
 * const isFirstRender = useIsFirstRender();
 *
 * useEffect(() => {
 *   if (isFirstRender) return; // skip the effect on mount
 *   console.log('value changed:', value);
 * }, [value]);
 * ```
 */

export default function useIsFirstRender(): boolean {
    const renderRef = useRef<boolean>(true);

    useEffect(() => {
        renderRef.current = false;
    }, []);

    return renderRef.current;
}