"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";

export default function AuthSync({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useConvexAuth();
    const storeUser = useMutation(api.users.store);
    const setOnline = useMutation(api.users.setOnlineStatus);

    useEffect(() => {
        if (isAuthenticated) {
            storeUser().catch(console.error);

            // Handle online status
            const syncStatus = () => {
                const isOnline = navigator.onLine && document.visibilityState === "visible";
                setOnline({ isOnline }).catch(() => { });
            };

            // Initial sync and setup interval for heartbeat
            syncStatus();
            const interval = setInterval(syncStatus, 30000);

            const handleVisibilityChange = () => {
                if (document.visibilityState === "hidden") {
                    setOnline({ isOnline: false }).catch(() => { });
                } else {
                    syncStatus();
                }
            };

            const handleOffline = () => setOnline({ isOnline: false }).catch(() => { });

            window.addEventListener("online", syncStatus);
            window.addEventListener("offline", handleOffline);
            window.addEventListener("pagehide", handleOffline);
            document.addEventListener("visibilitychange", handleVisibilityChange);

            return () => {
                clearInterval(interval);
                window.removeEventListener("online", syncStatus);
                window.removeEventListener("offline", handleOffline);
                window.removeEventListener("pagehide", handleOffline);
                document.removeEventListener("visibilitychange", handleVisibilityChange);

                // Try setting offline on unmount (e.g. logging out or leaving)
                handleOffline();
            };
        }
    }, [isAuthenticated, storeUser, setOnline]);

    return <>{children}</>;
}
