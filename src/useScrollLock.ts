import { useEffect } from "react";

/**
 * Locks body scroll while `locked` is true — for modals, drawers, and menus.
 * Compensates for scrollbar-width removal to avoid a layout shift.
 *
 * @param locked - Whether to lock the scroll or not
 *
 * @remarks
 * This hook is intended to be used in a component that is conditionally rendered, such as a modal or drawer.
 * When the component is mounted and `locked` is true, it will lock the scroll. When the component is unmounted or `locked` is false, it will restore the scroll.
 *
 * @example
 * useScrollLock(isModalOpen);
 */

export default function useScrollLock(isLocked: boolean = true): void {
  useEffect(() => {
    if (!isLocked) return;

    const originalOverflow = window.getComputedStyle(document.body).overflow;
    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const originalPaddingRight = parseFloat(
      window.getComputedStyle(document.body).paddingRight,
    );

    if (isLocked) {
      document.body.style.overflow = "hidden";

      // Adjust the body's padding to account for the scrollbar width, preventing layout shift
      if (scrollBarWidth > 0)
        document.body.style.paddingRight = `${originalPaddingRight + scrollBarWidth}px`;
    } else {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = `${originalPaddingRight}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = `${originalPaddingRight}px`;
    };
  }, [isLocked]);
}
