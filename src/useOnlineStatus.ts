import { useEffect, useState } from "react";

/**
 * Tracks the browser's online/offline connectivity status in real time.
 *
 * Subscribes to the `online` and `offline` window events and keeps state
 * in sync automatically — no manual polling required.
 *
 * @remarks
 * Falls back to `true` when `navigator` is unavailable (e.g. during SSR),
 * since assuming connectivity is the safer default until the client hydrates.
 *
 * @returns `true` if the browser currently reports an active connection,
 * `false` otherwise.
 *
 * @example
 * ```tsx
 * const isOnline = useOnlineStatus();
 * return <span>{isOnline ? '🟢 Connected' : '🔴 Offline'}</span>;
 * ```
 */

export default function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(()=>{
     return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  },[]);

  return isOnline;
}