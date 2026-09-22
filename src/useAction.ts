import { useActionState, useEffect, useRef } from 'react';

export type ActionResponse = {
    success: true;
    data: {
        message: string;
        [key: string]: unknown;
    };
} | {
    success: false;
    error: string;
};

interface UseActionReturn<T> {
    /** Dispatches the server action with the given payload. */
    action: (actionData: T) => void;
    /** `true` while the action is in flight. */
    isPending: boolean;
}

interface UseActionOptions<T> {
    /** The server action to run, following React's `useActionState` `(prevState, payload) => Promise<state>` signature. */
    serverAction: (prevState: ActionResponse, actionData: T) => Promise<ActionResponse>;
    /** Called once when the action resolves with `success: true`. */
    onSuccess?: (data: Extract<ActionResponse, { success: true; data: unknown }>['data']) => void;
    /** Called once when the action resolves with `success: false`. */
    onError?: (error: string) => void;
}

/**
 * Wraps a React Server Action with `success`/`data`/`error`-shaped
 * `onSuccess`/`onError` callbacks, built on top of React's `useActionState`.
 *
 * @remarks
 * Requires **React 19+** — `useActionState` doesn't exist in earlier
 * versions. This is a deliberate scope decision for this hook specifically;
 * it trades broad installability for direct integration with React's
 * built-in Server Actions/transitions model, rather than reimplementing
 * pending/error state manually.
 *
 * The initial state is cast to `ActionResponse` via `{} as ActionResponse`
 * purely to satisfy `useActionState`'s typing before any action has run —
 * it does not represent a real success or error response, and the mount-skip
 * logic below exists specifically to avoid treating it as one.
 *
 * @typeParam T - The type of the payload passed to `action`
 * @param props.serverAction - The server action to run
 * @param props.onSuccess - Called once when the action resolves with `success: true`
 * @param props.onError - Called once when the action resolves with `success: false`
 *
 * @example
 * ```tsx
 * const { action, isPending } = useAction({
 *   serverAction: updateProfile,
 *   onSuccess: (data) => toast.success(data.message),
 *   onError: (error) => toast.error(error),
 * });
 *
 * <form action={action}>
 *   <button disabled={isPending}>Save</button>
 * </form>
 * ```
 */

export default function useAction<T>({ serverAction, onSuccess, onError }: UseActionOptions<T>): UseActionReturn<T> {
    const [state, action, isPending] = useActionState(serverAction, {} as ActionResponse);
    const mountRef = useRef<boolean>(false);
    const callbacks = useRef({ onSuccess, onError });
    callbacks.current = { onSuccess, onError };

    useEffect(() => {
        // This to skip the first render
        if (!mountRef.current) {
            mountRef.current = true;
            return;
        }

        if (state.success) {
            callbacks.current.onSuccess?.(state.data);
        }
        else if (state.error) {
            callbacks.current.onError?.(state.error);
        }
    }, [state]);

    return { action, isPending };
}