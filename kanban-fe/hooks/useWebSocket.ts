import { useEffect, useRef, useState } from "react";

interface UseWebsocketProps<T> {
    url: string;
    trigger?: T;
    onMessage?: (data: string) => void;
}
export const useWebsocket = <T>({ url, trigger, onMessage }: UseWebsocketProps<T>) => {
    const [isReady, setIsReady] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const connect = () => {
            const socket = new WebSocket(url);

            socket.onopen = () => {
                setIsReady(true)
                console.log("WebSocket connected workspace");
            };
            socket.onclose = () => setIsReady(false);
            socket.onmessage = (event) => {
                onMessage?.(event.data);
            };
            socket.onerror = (error) => {
                console.error("WebSocket error", error);
                socket.close();
            };
            ws.current = socket;
        };
        connect();
        return () => ws.current?.close();
    }, [url, trigger]);

    return {
        isReady,
        send: ws.current?.send.bind(ws.current),
    };
};
