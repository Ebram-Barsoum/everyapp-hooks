import { act, renderHook } from "@testing-library/react";
import { startTransition } from "react";
import useAction, { type ActionResponse } from "../src/useAction";

type Payload = { name: string };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

async function dispatch(action: (data: Payload) => void, data: Payload) {
  await act(async () => {
    startTransition(() => action(data));
  });
}

describe("useAction", () => {
  it("does not call onSuccess or onError on mount", () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result } = renderHook(() =>
      useAction<Payload>({ serverAction: jest.fn(), onSuccess, onError })
    );

    expect(result.current.isPending).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("calls the server action with the previous state and payload", async () => {
    const serverAction = jest.fn(
      async (): Promise<ActionResponse> => ({ success: true, data: { message: "ok" } })
    );
    const { result } = renderHook(() => useAction<Payload>({ serverAction }));

    await dispatch(result.current.action, { name: "Ada" });

    expect(serverAction).toHaveBeenCalledWith({}, { name: "Ada" });
  });

  it("calls onSuccess with data when the action succeeds", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const serverAction = async (): Promise<ActionResponse> => ({
      success: true,
      data: { message: "Saved", id: 7 },
    });

    const { result } = renderHook(() =>
      useAction<Payload>({ serverAction, onSuccess, onError })
    );

    await dispatch(result.current.action, { name: "Ada" });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith({ message: "Saved", id: 7 });
    expect(onError).not.toHaveBeenCalled();
  });

  it("calls onError with the error when the action fails", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const serverAction = async (): Promise<ActionResponse> => ({
      success: false,
      error: "Name is required",
    });

    const { result } = renderHook(() =>
      useAction<Payload>({ serverAction, onSuccess, onError })
    );

    await dispatch(result.current.action, { name: "" });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("Name is required");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("reports isPending while the action is in flight", async () => {
    const pending = deferred<ActionResponse>();
    const serverAction = jest.fn(() => pending.promise);

    const { result } = renderHook(() => useAction<Payload>({ serverAction }));

    await dispatch(result.current.action, { name: "Ada" });
    expect(result.current.isPending).toBe(true);

    await act(async () => {
      pending.resolve({ success: true, data: { message: "done" } });
    });
    expect(result.current.isPending).toBe(false);
  });

  it("works without callbacks", async () => {
    const serverAction = async (): Promise<ActionResponse> => ({
      success: false,
      error: "nope",
    });
    const { result } = renderHook(() => useAction<Payload>({ serverAction }));

    await expect(dispatch(result.current.action, { name: "Ada" })).resolves.not.toThrow();
  });
});
