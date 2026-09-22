import { act, renderHook } from "@testing-library/react";
import useLocalStorage from "../src/useLocalStograge";

describe("useLocalStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns the initial value when the key is absent", () => {
    const { result } = renderHook(() =>
      useLocalStorage({ key: "theme", initialValue: "light" })
    );

    expect(result.current.value).toBe("light");
  });

  it("reads an existing JSON value from storage", () => {
    window.localStorage.setItem("user", JSON.stringify({ name: "Ada", age: 36 }));

    const { result } = renderHook(() =>
      useLocalStorage({ key: "user", initialValue: { name: "", age: 0 } })
    );

    expect(result.current.value).toEqual({ name: "Ada", age: 36 });
  });

  it("writes to both state and storage", () => {
    const { result } = renderHook(() =>
      useLocalStorage({ key: "count", initialValue: 0 })
    );

    act(() => result.current.writeValue(5));

    expect(result.current.value).toBe(5);
    expect(window.localStorage.getItem("count")).toBe("5");
  });

  it("falls back to the initial value when stored JSON is invalid", () => {
    window.localStorage.setItem("broken", "{not json");

    const { result } = renderHook(() =>
      useLocalStorage({ key: "broken", initialValue: "fallback" })
    );

    expect(result.current.value).toBe("fallback");
    expect(console.warn).toHaveBeenCalled();
  });

  it("does not throw when storage writes fail", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const { result } = renderHook(() =>
      useLocalStorage({ key: "big", initialValue: "a" })
    );

    expect(() => act(() => result.current.writeValue("b"))).not.toThrow();
    expect(console.warn).toHaveBeenCalled();
  });

  it("syncs when a storage event fires for the same key", () => {
    const { result } = renderHook(() =>
      useLocalStorage({ key: "theme", initialValue: "light" })
    );

    act(() => {
      window.localStorage.setItem("theme", JSON.stringify("dark"));
      window.dispatchEvent(new StorageEvent("storage", { key: "theme" }));
    });

    expect(result.current.value).toBe("dark");
  });

  it("ignores storage events for other keys", () => {
    const { result } = renderHook(() =>
      useLocalStorage({ key: "theme", initialValue: "light" })
    );

    act(() => {
      window.localStorage.setItem("theme", JSON.stringify("dark"));
      window.dispatchEvent(new StorageEvent("storage", { key: "other" }));
    });

    expect(result.current.value).toBe("light");
  });

  it("removes the storage listener on unmount", () => {
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() =>
      useLocalStorage({ key: "theme", initialValue: "light" })
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("storage", expect.any(Function));
  });
});
