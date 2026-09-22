import { act, renderHook } from "@testing-library/react";
import useOnlineStatus from "../src/useOnlineStatus";

function mockNavigatorOnLine(value: boolean) {
  jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(value);
}

describe("useOnlineStatus", () => {
  it("returns true when the browser starts online", () => {
    mockNavigatorOnLine(true);
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);
  });

  it("returns false when the browser starts offline", () => {
    mockNavigatorOnLine(false);
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);
  });

  it("updates when offline / online events fire", () => {
    mockNavigatorOnLine(true);
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);
  });

  it("removes its listeners on unmount", () => {
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useOnlineStatus());

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("offline", expect.any(Function));
  });
});
