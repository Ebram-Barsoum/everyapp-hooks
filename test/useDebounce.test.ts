import { act, renderHook } from "@testing-library/react";
import useDebounce from "../src/useDebounce";

type Props<T> = { value: T; delay: number };

function setup<T>(initialProps: Props<T>) {
  return renderHook((props: Props<T>) => useDebounce(props), { initialProps });
}

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the initial value immediately, without waiting for the delay", () => {
    const { result } = setup({ value: "hello", delay: 300 });

    expect(result.current).toBe("hello");
  });

  it("keeps the previous value until the delay has passed", () => {
    const { result, rerender } = setup({ value: "a", delay: 300 });

    rerender({ value: "ab", delay: 300 });
    expect(result.current).toBe("a");

    act(() => jest.advanceTimersByTime(299));
    expect(result.current).toBe("a");

    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe("ab");
  });

  it("only applies the last value after rapid changes", () => {
    const { result, rerender } = setup({ value: "", delay: 300 });

    for (const value of ["r", "re", "rea", "reac", "react"]) {
      rerender({ value, delay: 300 });
      act(() => jest.advanceTimersByTime(100)); // less than the delay each time
    }
    expect(result.current).toBe("");

    act(() => jest.advanceTimersByTime(200)); // 300ms after the last change
    expect(result.current).toBe("react");
  });

  it("restarts the timer on every change", () => {
    const { result, rerender } = setup({ value: 1, delay: 500 });

    rerender({ value: 2, delay: 500 });
    act(() => jest.advanceTimersByTime(400));

    rerender({ value: 3, delay: 500 });
    act(() => jest.advanceTimersByTime(400));
    expect(result.current).toBe(1); // 800ms total, but only 400ms since the last change

    act(() => jest.advanceTimersByTime(100));
    expect(result.current).toBe(3);
  });

  it("updates once per settled change", () => {
    const renders = jest.fn();
    const { rerender } = renderHook((props: Props<string>) => {
      const debounced = useDebounce(props);
      renders(debounced);
      return debounced;
    }, { initialProps: { value: "a", delay: 200 } });

    rerender({ value: "b", delay: 200 });
    rerender({ value: "c", delay: 200 });
    act(() => jest.advanceTimersByTime(200));

    const distinctValues = [...new Set(renders.mock.calls.map(([v]) => v))];
    expect(distinctValues).toEqual(["a", "c"]); // "b" is never exposed
  });

  it("starts a full new delay when the delay changes while pending", () => {
    const { result, rerender } = setup({ value: "a", delay: 1000 });

    rerender({ value: "b", delay: 1000 });
    act(() => jest.advanceTimersByTime(800));

    rerender({ value: "b", delay: 500 });
    act(() => jest.advanceTimersByTime(499));
    expect(result.current).toBe("a"); // old timer's remaining 200ms is not kept

    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe("b");
  });

  it("applies the value on the next tick with a delay of 0", () => {
    const { result, rerender } = setup({ value: "a", delay: 0 });

    rerender({ value: "b", delay: 0 });
    expect(result.current).toBe("a");

    act(() => jest.advanceTimersByTime(0));
    expect(result.current).toBe("b");
  });

  it("works with non-primitive values and keeps their identity", () => {
    const first = { query: "shoes" };
    const second = { query: "boots" };
    const { result, rerender } = setup({ value: first, delay: 300 });

    rerender({ value: second, delay: 300 });
    act(() => jest.advanceTimersByTime(300));

    expect(result.current).toBe(second);
  });

  it("clears the pending timer on unmount", () => {
    const clearSpy = jest.spyOn(globalThis, "clearTimeout");
    const { rerender, unmount } = setup({ value: "a", delay: 300 });

    rerender({ value: "b", delay: 300 });
    unmount();

    expect(clearSpy).toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});
