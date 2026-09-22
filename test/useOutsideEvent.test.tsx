import { useRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import useOutsideEvent from "../src/useOutsideEvent";

function Harness({
  callback,
  eventType,
}: {
  callback: () => void;
  eventType?: keyof DocumentEventMap;
}) {
  const ref = useRef<HTMLDivElement>(null!);
  useOutsideEvent({ ref, callback, eventType });

  return (
    <div>
      <div ref={ref} data-testid="inside">
        <button>inner button</button>
      </div>
      <button>outside button</button>
    </div>
  );
}

describe("useOutsideEvent", () => {
  it("calls the callback on mousedown outside the element", () => {
    const callback = jest.fn();
    render(<Harness callback={callback} />);

    fireEvent.mouseDown(screen.getByText("outside button"));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("does not call the callback when the event is inside the element", () => {
    const callback = jest.fn();
    render(<Harness callback={callback} />);

    fireEvent.mouseDown(screen.getByTestId("inside"));
    fireEvent.mouseDown(screen.getByText("inner button"));

    expect(callback).not.toHaveBeenCalled();
  });

  it("only listens for mousedown by default", () => {
    const callback = jest.fn();
    render(<Harness callback={callback} />);

    fireEvent.click(screen.getByText("outside button"));
    fireEvent.touchStart(screen.getByText("outside button"));

    expect(callback).not.toHaveBeenCalled();
  });

  it("supports a custom eventType", () => {
    const callback = jest.fn();
    render(<Harness callback={callback} eventType="touchstart" />);

    fireEvent.mouseDown(screen.getByText("outside button"));
    expect(callback).not.toHaveBeenCalled();

    fireEvent.touchStart(screen.getByText("outside button"));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("stops listening after unmount", () => {
    const callback = jest.fn();
    const { unmount } = render(<Harness callback={callback} />);

    unmount();
    fireEvent.mouseDown(document.body);

    expect(callback).not.toHaveBeenCalled();
  });

  it("uses the latest callback after a rerender", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = render(<Harness callback={first} />);

    rerender(<Harness callback={second} />);
    fireEvent.mouseDown(screen.getByText("outside button"));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
