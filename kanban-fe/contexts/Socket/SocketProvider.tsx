import { getProfile } from "@/api/profile";
import { accessToken } from "@/lib/http";
import { RequestType } from "@/types/ProfileType";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react";

interface SocketContextValue {
    isConnected: boolean;
    requests: RequestType[];
}

const SocketContext = createContext<SocketContextValue | null>(null)
export const SocketProvider = ({ children }: PropsWithChildren) => {
    const [isConnected, setIsConnected] = useState(false);

    const [requests, setRequests] = useState<RequestType[]>([]);

    if (process.env.NEXT_PUBLIC_BASE_URL === undefined) {
        throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
    }

    const [val, setVal] = useState<string>();
    const connectWebSocket = useCallback(() => {
        if (!accessToken.value) return;
        const ws = new WebSocket(`ws://${process.env.NEXT_PUBLIC_BASE_URL.replace(/^http:\/\//, '')}/ws/user/?token=${accessToken.value}`)
        ws.onopen = () => {
            setIsConnected(true);
            console.log("Connected to WebSocket")
        };
        ws.onmessage = (event) => {
            console.log("Message received", event.data);
            setVal(event.data);
        };
        ws.onclose = (event) => {
            setIsConnected(false);
            if (event.wasClean) {
                console.log("WebSocket closed cleanly");
            } else {
                console.error("WebSocket closed unexpectedly");
                getProfile();
                setTimeout(() => {
                    console.log("Attempting to reconnect...");
                    connectWebSocket();
                }, 5000);
            }
        };
        ws.onerror = (error) => {
            setIsConnected(false);
            console.error("WebSocket error", error);
            ws.close();
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [])

    useEffect(() => {
        const cleanup = connectWebSocket();
        
        return () => {
            cleanup?.();
        };
    }, [connectWebSocket]);

    useEffect(() => {
        if (!val) return;
        const data = JSON.parse(val);
        if (data.requests) {
            setRequests(data.requests)
        }
    }, [val])

    return (
        <SocketContext.Provider value={{
            isConnected,
            requests
        }}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
}