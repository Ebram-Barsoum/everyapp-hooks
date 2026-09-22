import { renderHook } from "@testing-library/react";
import useScrollLock from "../src/useScrollLock";

function setScrollbarWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
  Object.defineProperty(document.documentElement, "clientWidth", {
    value: 1024 - width,
    configurable: true,
  });
}

describe("useScrollLock", () => {
  beforeEach(() => {
    document.body.removeAttribute("style");
    setScrollbarWidth(0);
  });

  it("locks body scroll by default", () => {
    renderHook(() => useScrollLock());

    expect(document.body.style.overflow).toBe("hidden");
  });

  it("does nothing when isLocked is false", () => {
    document.body.style.overflow = "auto";
    renderHook(() => useScrollLock(false));

    expect(document.body.style.overflow).toBe("auto");
  });

  it("restores the original overflow on unmount", () => {
    document.body.style.overflow = "scroll";
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("scroll");
  });

  it("restores the original overflow when isLocked flips to false", () => {
    document.body.style.overflow = "auto";
    const { rerender } = renderHook(({ locked }) => useScrollLock(locked), {
      initialProps: { locked: true },
    });
    expect(document.body.style.overflow).toBe("hidden");

    rerender({ locked: false });

    expect(document.body.style.overflow).toBe("auto");
  });

  it("does not touch padding when there is no scrollbar", () => {
    renderHook(() => useScrollLock(true));

    expect(document.body.style.paddingRight).toBe("");
  });

  it("compensates padding for the scrollbar width", () => {
    document.body.style.paddingRight = "0px";
    setScrollbarWidth(15);

    renderHook(() => useScrollLock(true));

    expect(document.body.style.paddingRight).toBe("15px");
  });
});
