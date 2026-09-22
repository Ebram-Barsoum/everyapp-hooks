import { useCallback, useEffect, useRef, useState } from "react";

interface UseLocalStorageOptions<T> {
    /** The `localStorage` key to read from and write to. */
    key: string;
    /** Value to fall back to when the key is absent or unreadable. */
    initialValue: T;
}

interface UseLocalStorageReturn<T> {
    /** The current value — from storage on first render, then from state. */
    value: T;
    /** Writes a new value to both `localStorage` and React state. */
    writeValue: (newValue: T) => void;
}

/**
 * Persists a piece of state in `localStorage`, reading the stored value on
 * first render and writing through on every update. Values are serialized
 * with `JSON.stringify`, so any JSON-serializable type works.
 *
 * @remarks
 * Storage failures are caught and logged rather than thrown — if
 * `localStorage` is unavailable (private browsing, quota exceeded), reads
 * fall back to `initialValue` and writes are skipped, while React state
 * still updates so the UI stays responsive.
 *
 * @typeParam T - The type of the stored value
 * @param props.key - The `localStorage` key to read from and write to
 * @param props.initialValue - Value to fall back to when the key is absent or unreadable
 *
 * @example
 * ```tsx
 * const { value: theme, writeValue: setTheme } =
 *   useLocalStorage<'light' | 'dark'>({ key: 'theme', initialValue: 'light' });
 *
 * <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *   Toggle theme
 * </button>
 * ```
 */

export default function useLocalStorage<T>({ key, initialValue }: UseLocalStorageOptions<T>): UseLocalStorageReturn<T> {
    const initialValueRef = useRef<T>(initialValue);
    initialValueRef.current = initialValue;

    const readValue = useCallback((key: string) => {
            if(typeof window === 'undefined') return initialValueRef.current;
            
            try {
                const item = window.localStorage.getItem(key);
                return item ? (JSON.parse(item) as T) : initialValueRef.current;
            } catch (error) {
                console.warn(error);
                return initialValueRef.current;
            }
    }, [key]);

    const [value, setValue] = useState<T>(() => readValue(key));

    const writeValue = useCallback((newValue: T) => {
            if(typeof window === 'undefined') return setValue(newValue);

            try {
                window.localStorage.setItem(key, JSON.stringify(newValue));
            } catch (error) {
                console.warn(error);
            }
            finally{
                 setValue(newValue);
            }
    }, [key]);

    // Update the state when the storage event is fired (e.g. in another tab)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if(e.key === key)setValue(readValue(key));
        }

        window.addEventListener('storage', handleStorageChange);

        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, readValue]);

    return { value, writeValue };
}