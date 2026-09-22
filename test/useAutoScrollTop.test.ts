import { renderHook } from "@testing-library/react";
import useAutoScrollTop from "../src/useAutoScrollTop";

describe("useAutoScrollTop", () => {
  let scrollToSpy: jest.Mock;

  beforeEach(() => {
    scrollToSpy = jest.fn();
    // jsdom doesn't implement scrollTo
    Object.defineProperty(window, "scrollTo", { value: scrollToSpy, writable: true });
  });

  it("scrolls to the top on mount with the given behavior", () => {
    renderHook(() => useAutoScrollTop({ trigger: "/home", behavior: "instant" }));

    expect(scrollToSpy).toHaveBeenCalledTimes(1);
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
  });

  it("defaults to smooth scrolling", () => {
    renderHook(() =>
      useAutoScrollTop({ trigger: "/home" } as Parameters<typeof useAutoScrollTop>[0])
    );

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "smooth" });
  });

  it("scrolls again only when the trigger changes", () => {
    const { rerender } = renderHook(
      ({ trigger }) => useAutoScrollTop({ trigger, behavior: "smooth" }),
      { initialProps: { trigger: "/home" } }
    );

    rerender({ trigger: "/home" });
    expect(scrollToSpy).toHaveBeenCalledTimes(1);

    rerender({ trigger: "/about" });
    expect(scrollToSpy).toHaveBeenCalledTimes(2);
  });
});
