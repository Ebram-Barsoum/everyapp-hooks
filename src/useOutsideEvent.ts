import { useEffect } from "react";

interface UseOutsideEventProps<T extends HTMLElement = HTMLElement> {
  /** Ref to the element that defines the "inside" boundary. */
  ref: React.RefObject<T>;
  /** Called when a matching event occurs outside `ref`'s element. */
  callback: () => void;
  /** Which document event to listen for. @default "mousedown" */
  eventType?: keyof DocumentEventMap;
}

/**
 * Calls `callback` when an event of type `eventType` fires outside the
 * element attached to `ref`. Defaults to `"mousedown"`, making it well
 * suited for closing dropdowns, modals, and popovers on outside click —
 * but any `DocumentEventMap` event (`"keydown"`, `"focusin"`, `"touchstart"`,
 * etc.) can be used instead.
 *
 * @remarks
 * Re-subscribes the event listener whenever `ref` or `callback` or `eventType` changes.
 * Since `ref` objects are stable across renders, the effective driver of
 * re-subscription is `callback` — pass a memoized function (`useCallback`)
 * if it's defined inline in a component body, to avoid attaching/detaching
 * the listener on every render.
 *
 * @typeParam T - The type of element `ref` points to
 * @param props.ref - Ref to the element that defines the "inside" boundary
 * @param props.callback - Called when a matching event occurs outside `ref`'s element
 * @param props.eventType - Which document event to listen for
 * @returns The same `ref` that was passed in
 *
 * @example
 * ```tsx
 * const menuRef = useRef<HTMLDivElement>(null);
 * useOutsideEvent({ ref: menuRef, callback: () => setOpen(false) });
 * return <div ref={menuRef}>{open && <Menu />}</div>;
 * ```
 */

export default function useOutsideEvent<T extends HTMLElement = HTMLElement>({
  ref,
  callback,
  eventType = "mousedown",
}: UseOutsideEventProps<T>): React.RefObject<T> {
  useEffect(() => {
    function handleClickOutside(event: DocumentEventMap[typeof eventType]) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    document.addEventListener(eventType, handleClickOutside);

    return () => {
      document.removeEventListener(eventType, handleClickOutside);
    };
  }, [ref, callback, eventType]);

  return ref;
}
