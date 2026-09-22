import { renderHook } from "@testing-library/react";
import useIsFirstRender from "../src/useIsFirstRender";

describe("useIsFirstRender", () => {
  it("returns true on the initial render", () => {
    const { result } = renderHook(() => useIsFirstRender());
    expect(result.current).toBe(true);
  });

  it("returns false after a re-render", () => {
    const { result, rerender } = renderHook(() => useIsFirstRender());

    expect(result.current).toBe(true);

    rerender();

    expect(result.current).toBe(false);
  });

  it("stays false across multiple subsequent re-renders", () => {
    const { result, rerender } = renderHook(() => useIsFirstRender());

    rerender();
    expect(result.current).toBe(false);

    rerender();
    expect(result.current).toBe(false);

    rerender();
    expect(result.current).toBe(false);
  });

  it("tracks first render independently per hook instance", () => {
    const first = renderHook(() => useIsFirstRender());
    expect(first.result.current).toBe(true);

    first.rerender();
    expect(first.result.current).toBe(false);

    // A second, separate instance should start fresh
    const second = renderHook(() => useIsFirstRender());
    expect(second.result.current).toBe(true);
  });
});