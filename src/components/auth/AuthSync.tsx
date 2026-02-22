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
            const handleOnline = () => setOnline({ isOnline: true });
            const handleOffline = () => setOnline({ isOnline: false });

            handleOnline();

            window.addEventListener("online", handleOnline);
            window.addEventListener("offline", handleOffline);
            window.addEventListener("beforeunload", handleOffline);

            return () => {
                window.removeEventListener("online", handleOnline);
                window.removeEventListener("offline", handleOffline);
                window.removeEventListener("beforeunload", handleOffline);
            };
        }
    }, [isAuthenticated, storeUser, setOnline]);

    return <>{children}</>;
}
