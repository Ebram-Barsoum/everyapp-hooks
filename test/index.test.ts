import * as entry from "../src";

describe("package entry", () => {
  it.each([
    "useAction",
    "useAutoScrollTop",
    "useInView",
    "useLocalStorage",
    "useMultistepForm",
    "useOnlineStatus",
    "useOutsideEvent",
    "useQueryParams",
    "useScrollLock",
    "useIsFirstRender",
  ])("exports %s", (name) => {
    expect(typeof (entry as Record<string, unknown>)[name]).toBe("function");
  });
});
