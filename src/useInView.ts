import { useEffect, useRef, useState } from "react";

interface UseInViewOptions extends IntersectionObserverInit {
  /** Stop observing after the element first enters the viewport. @default false */
  once?: boolean;
}

interface UseInViewReturn<T extends HTMLElement> {
  /** Attach this to the element you want to observe. */
  ref: React.RefObject<T | null>;
  /** `true` while the observed element intersects the viewport (or `root`). */
  inView: boolean;
}

/**
 * Tracks whether an element is currently visible in the viewport, using
 * `IntersectionObserver`. Useful for scroll-triggered animations, lazy
 * loading images, and infinite-scroll sentinels.
 *
 * @remarks
 * Extends `IntersectionObserverInit`, so `root`, `rootMargin`, and
 * `threshold` are all passed straight through to the underlying observer.
 *
 * @typeParam T - The type of element being observed
 * @param options - Observer configuration, plus `once`
 * @returns A `ref` to attach to the target element, and its current `inView` state
 *
 * @example
 * ```tsx
 * const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.5 });
 * return <div ref={ref} className={inView ? "animate-in" : ""}>Content</div>;
 * ```
 */

export default function useInView<T extends HTMLElement = HTMLDivElement>(options: UseInViewOptions = {}): UseInViewReturn<T> {
    const [inView, setInView] = useState(false);
    const ref = useRef<T | null>(null);
    const { once = false, ...observerOptions } = options;

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setInView(entry.isIntersecting);

                if (once && entry.isIntersecting) {
                    observer.disconnect();
                }
            },
            observerOptions
        );

         observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [once, observerOptions.root, observerOptions.rootMargin, observerOptions.threshold]);

    return { ref, inView };
}