import { useEffect } from "react";

/**
 * Scrolls the window to the top whenever `trigger` changes — typically a
 * route pathname, to replicate default multi-page-app navigation behavior
 * in an SPA.
 *
 * @example
 * useAutoScrollTop({trigger: location.pathname, behavior: "smooth"});
 */

interface UseAutoScrollTop {
  trigger: unknown;
  behavior: ScrollBehavior; // "smooth" | "instant" | "auto", default "smooth"
}

export default function useAutoScrollTop({
  trigger,
  behavior = "smooth",
}: UseAutoScrollTop) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior });
  }, [trigger, behavior]);
}
