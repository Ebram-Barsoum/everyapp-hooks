import { act, render, screen } from "@testing-library/react";
import useInView from "../src/useInView";

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: Callback;
  options: IntersectionObserverInit;
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();

  constructor(callback: Callback, options: IntersectionObserverInit = {}) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting: boolean) {
    act(() => this.callback([{ isIntersecting }]));
  }
}

function latestObserver() {
  return MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1];
}

function Harness(props: Parameters<typeof useInView>[0]) {
  const { ref, inView } = useInView<HTMLDivElement>(props);
  return (
    <div ref={ref} data-testid="target">
      {inView ? "visible" : "hidden"}
    </div>
  );
}

describe("useInView", () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    (window as any).IntersectionObserver = MockIntersectionObserver;
  });

  it("starts out of view and observes the ref element", () => {
    render(<Harness />);

    expect(screen.getByTestId("target")).toHaveTextContent("hidden");
    expect(latestObserver().observe).toHaveBeenCalledWith(screen.getByTestId("target"));
  });

  it("passes observer options through", () => {
    render(<Harness threshold={0.5} rootMargin="10px" once />);

    expect(latestObserver().options).toEqual({ threshold: 0.5, rootMargin: "10px" });
  });

  it("toggles inView as the element enters and leaves", () => {
    render(<Harness />);

    latestObserver().trigger(true);
    expect(screen.getByTestId("target")).toHaveTextContent("visible");

    latestObserver().trigger(false);
    expect(screen.getByTestId("target")).toHaveTextContent("hidden");
  });

  it("disconnects after first intersection when once is true", () => {
    render(<Harness once />);
    const observer = latestObserver();

    observer.trigger(false);
    expect(observer.disconnect).not.toHaveBeenCalled();

    observer.trigger(true);
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("target")).toHaveTextContent("visible");
  });

  it("keeps observing when once is false", () => {
    render(<Harness />);
    const observer = latestObserver();

    observer.trigger(true);

    expect(observer.disconnect).not.toHaveBeenCalled();
  });

  it("disconnects on unmount", () => {
    const { unmount } = render(<Harness />);
    const observer = latestObserver();

    unmount();

    expect(observer.disconnect).toHaveBeenCalled();
  });

  it("does not create an observer when the ref is never attached", () => {
    function Unattached() {
      useInView();
      return null;
    }
    render(<Unattached />);

    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });
});
