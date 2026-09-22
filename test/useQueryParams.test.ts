import { act, renderHook } from "@testing-library/react";
import useQueryParams from "../src/useQueryParams";

function setUrl(search: string) {
  window.history.replaceState({}, "", `/products${search}`);
}

function paramsOf(query: string) {
  return Object.fromEntries(new URLSearchParams(query));
}

describe("useQueryParams", () => {
  beforeEach(() => setUrl(""));

  it("reads params from the current URL", () => {
    setUrl("?sort=price&category=shoes");
    const { result } = renderHook(() => useQueryParams());

    expect(result.current.getParam("sort")).toBe("price");
    expect(result.current.getParam("category")).toBe("shoes");
    expect(result.current.getParam("missing")).toBeNull();
  });

  it("getQueryString returns the query without a leading '?'", () => {
    setUrl("?a=1&b=2");
    const { result } = renderHook(() => useQueryParams());

    expect(result.current.getQueryString()).toBe("a=1&b=2");
  });

  describe("setParam", () => {
    it("sets a param, keeps others and resets page to 1", () => {
      setUrl("?category=shoes&page=4");
      const { result } = renderHook(() => useQueryParams());

      act(() => result.current.setParam("sort", "price"));

      expect(paramsOf(result.current.getQueryString())).toEqual({
        category: "shoes",
        sort: "price",
        page: "1",
      });
    });

    it("does not reset page when setting page itself", () => {
      setUrl("?category=shoes");
      const { result } = renderHook(() => useQueryParams());

      act(() => result.current.setParam("page", "3"));

      expect(result.current.getParam("page")).toBe("3");
      expect(result.current.getParam("category")).toBe("shoes");
    });
  });

  it("removeParam removes a param and resets page", () => {
    setUrl("?category=shoes&sort=price&page=2");
    const { result } = renderHook(() => useQueryParams());

    act(() => result.current.removeParam("sort"));

    expect(paramsOf(result.current.getQueryString())).toEqual({
      category: "shoes",
      page: "1",
    });
  });

  it("setOnlyParam discards every other param", () => {
    setUrl("?category=shoes&sort=price&page=2");
    const { result } = renderHook(() => useQueryParams());

    act(() => result.current.setOnlyParam("category", "hats"));

    expect(paramsOf(result.current.getQueryString())).toEqual({
      category: "hats",
      page: "1",
    });
  });

  it("setMultipleParams sets several params and adds page=1 when missing", () => {
    setUrl("?q=boots");
    const { result } = renderHook(() => useQueryParams());

    act(() =>
      result.current.setMultipleParams({ category: "shoes", sort: "price" }),
    );

    expect(paramsOf(result.current.getQueryString())).toEqual({
      q: "boots",
      category: "shoes",
      sort: "price",
    });
  });

  it("removeMultipleParams removes several params", () => {
    setUrl("?q=boots&category=shoes&sort=price");
    const { result } = renderHook(() => useQueryParams());

    act(() => result.current.removeMultipleParams(["category", "sort"]));

    expect(paramsOf(result.current.getQueryString())).toEqual({ q: "boots" });
  });

  it("resetParams clears everything", () => {
    setUrl("?q=boots&page=3");
    const { result } = renderHook(() => useQueryParams());

    act(() => result.current.resetParams());

    expect(result.current.getQueryString()).toBe("");
  });

  it("syncs state on browser back/forward (popstate)", () => {
    const { result } = renderHook(() => useQueryParams());

    act(() => {
      setUrl("?tab=reviews");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(result.current.getParam("tab")).toBe("reviews");
  });

  it("removes the popstate listener on unmount", () => {
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useQueryParams());

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("popstate", expect.any(Function));
  });

  it("writes the new params to the browser URL", () => {
    const { result } = renderHook(() => useQueryParams());

    act(() => result.current.setParam("sort", "price"));

    expect(paramsOf(window.location.search)).toEqual({ sort: "price" });
  });

  it("keeps the pathname when updating the URL", () => {
    const { result } = renderHook(() => useQueryParams());

    act(() => result.current.setParam("sort", "price"));

    expect(window.location.pathname).toBe("/products");
  });
});
