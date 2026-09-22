import { useEffect, useRef, useState } from "react";

interface UseQueryParamsReturn {
  /** Reads a single query param's current value. */
  getParam: (param: string) => string | null;

  /** Sets a single query param, preserving all other existing params. */
  setParam: (param: string, value: string) => void;

  /** Removes a single query param, preserving all other existing params. */
  removeParam: (param: string) => void;

  /** Resets all query params to their initial values. */
  resetParams: () => void;

  /** Returns the current query string. */
  getQueryString: () => string;

  /** Replaces the entire query string with just this one param, discarding every other existing param. */
  setOnlyParam: (param: string, value: string) => void;

  /** Sets multiple query params at once, preserving all other existing params. */
  setMultipleParams: (params: Record<string, string>) => void;

  /** Removes multiple query params, preserving all other existing params. */
  removeMultipleParams: (params: string[]) => void;
}

/**
 * A React hook for reading and manipulating query params in the URL.
 *
 * @remarks
 * This hook uses the browser's `URLSearchParams` API to read and manipulate query params.
 *
 * Most setters reset the `page` param back to `"1"`, on the assumption
 * that changing filters/sorting should return the user to the first page
 * of results. `setParam` is the one exception — it only resets `page`
 * when the param being set isn't `page` itself.
 *
 * @example
 * ```tsx
 * const { getParam, setParam, removeParam } = useQueryParams();
 * const sort = getParam("sort");
 * <button onClick={() => setParam("sort", "price")}>Sort by price</button>
 * ```
 */

export default function useQueryParams(): UseQueryParamsReturn {
  const [searchParams, setSearchParams] = useState(() => {
    return typeof window !== "undefined"
      ? new URL(window.location.href).searchParams
      : new URLSearchParams();
  });
  const renderRef = useRef(false);

  // Update the URL and searchParams state whenever the user navigates with the browser's back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const newUrl = new URL(window.location.href);
      setSearchParams(newUrl.searchParams);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Update the URL in the browser whenever searchParams changes
  useEffect(() => {
    // skip first render
    if (!renderRef.current) {
      renderRef.current = true;
      return;
    }

    const url = new URL(window.location.href);
    url.search = searchParams.toString();
    window.history.replaceState({}, "", url);
  }, [searchParams]);

  /**
   * Reads a single query param's current value.
   *
   * @param param - The param name to read
   * @returns The param's value, or `null` if it isn't present
   */
  const getParam = (param: string) => {
    return searchParams.get(param);
  };

  /**
   * Sets a single query param, preserving all other existing params.
   *
   * @remarks
   * Resets `page` to `"1"` unless `param` itself is `"page"` — so
   * changing a filter/sort doesn't leave the user stranded on a page
   * that may no longer exist for the new result set.
   *
   * @param param - The param name to set
   * @param value - The value to assign
   */
  const setParam = (param: string, value: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set(param, value);

      // reset page to 1 if param is not page and if page exists
      if (param !== "page" && getParam("page")) params.set("page", "1");

      return params;
    });
  };

  /**
   * Removes a single query param, preserving all other existing params.
   *
   * @param param - The param name to remove
   */
  const removeParam = (param: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete(param);

      // reset page to 1 if param is not page and if page exists
      if (param !== "page" && getParam("page")) params.set("page", "1");

      return params;
    });
  };

  /**
   * Replaces the entire query string with just this one param, discarding
   * every other existing param. Also resets `page` to `"1"` is page is exist in the URL.
   *
   * @remarks
   * Use this when setting one param should clear all others — e.g.
   * switching category filters where old filters no longer apply.
   *
   * @param param - The param name to set
   * @param value - The value to assign
   */
  const setOnlyParam = (param: string, value: string) => {
    const params = new URLSearchParams();
    params.set(param, value);

    // reset page to 1 if param is not page and if page exsts
    if (param !== "page" && getParam("page")) params.set("page", "1");

    setSearchParams(params);
  };

  /**
   * Sets multiple query params at once, preserving all other existing
   * params. Always resets `page` to `"1"`.
   *
   * @param params - A map of param names to the values to assign
   *
   * @example
   * ```tsx
   * setMultipleParams({ category: "shoes", sort: "price" });
   * ```
   */
  const setMultipleParams = (params: Record<string, string>) => {
    const urlParams = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(params)) {
      urlParams.set(key, value);
    }

    if (urlParams.has("page")) {
      urlParams.set("page", "1");
    }

    setSearchParams(urlParams);
  };

  /**
   * Removes multiple query params at once, preserving all other existing
   * params. Always resets `page` to `"1"`.
   *
   * @param params - The param names to remove
   */
  const removeMultipleParams = (params: string[]) => {
    const urlParams = new URLSearchParams(searchParams);

    for (const param of params) {
      urlParams.delete(param);
    }

    if (urlParams.has("page")) {
      urlParams.set("page", "1");
    }

    setSearchParams(urlParams);
  };

  /**
   * Returns the current query string exactly as-is, with no side effects
   * (no navigation, no param resets).
   *
   * @returns The current query string, without a leading `?`
   */
  const getQueryString = () => {
    const params = new URLSearchParams(searchParams);

    return params.toString();
  };

  /**
   * Clears all query params, navigating back to the bare pathname.
   */
  const resetParams = () => {
    const params = new URLSearchParams();
    setSearchParams(params);
  };

  return {
    getParam,
    setParam,
    removeParam,
    resetParams,
    getQueryString,
    setOnlyParam,
    setMultipleParams,
    removeMultipleParams,
  };
}
