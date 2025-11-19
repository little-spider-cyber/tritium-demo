import { useEffect, useState, useRef, useCallback } from 'react';
import pako from 'pako';
import { TokenData, WebSocketMessage, TokenInfo } from '../types/token';

const WS_URL = 'wss://web-t.pinkpunk.io/ws';

export const useTokenWebSocket = () => {
  const [data, setData] = useState<TokenData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef<number>(0);

  const decompressData = (compressedString: string): string | null => {
    try {
      // 1. Convert ISO-8859-1 string to byte array
      const byteArray = new Uint8Array(compressedString.length);
      for (let i = 0; i < compressedString.length; i++) {
        byteArray[i] = compressedString.charCodeAt(i) & 0xFF;
      }

      // 2. GZIP decompress
      const decompressedData = pako.inflate(byteArray);

      // 3. Convert to UTF-8 string
      return new TextDecoder('utf-8').decode(decompressedData);
    } catch (err) {
      // It's possible the data is not compressed or is just a normal JSON string
      return null;
    }
  };

  const handleMessage = useCallback((message: WebSocketMessage) => {
    // Handle Ping/Pong
    // Assuming the server sends a message with topic 'ping' or we need to keep alive
    // The documentation says: "You will need to reply pong to ping message"
    if ("ping" in message) {
      const pongMsg = {
        topic: "pong",
        event: "sub",
        pong: message.ping || Date.now().toString(), // Use received ping TS if available
        interval: "",
        pair: "",
        chainId: "",
        compression: 1
      };
      wsRef.current?.send(JSON.stringify(pongMsg));
      return;
    }

    if ("topic" in message && message.topic === 'trending' && message.data) {
      // Parse info string to object if necessary
      const processedData = message.data.map(item => {
        let parsedInfo: TokenInfo | string = item.info;
        if (typeof item.info === 'string') {
          try {
            parsedInfo = JSON.parse(item.info);
          } catch (e) {
            // keep as string if parse fails
          }
        }
        return {
          ...item,
          info: parsedInfo
        };
      });
      setData(processedData);
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Clean up existing connection if any (e.g. if in closing state)
    if (wsRef.current) {
        wsRef.current.close();
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectCountRef.current = 0;
      
      // Subscribe
      const subMsg = {
        topic: "trending",
        event: "sub",
        interval: "",
        pair: "",
        chainId: "56",
        compression: 0
      };
      ws.send(JSON.stringify(subMsg));
    };

    ws.onmessage = (event) => {
      const messageData = event.data;
      
      if (typeof messageData === 'string') {
        let parsed: WebSocketMessage | null = null;
        
        // Try parsing as plain JSON first
        try {
            parsed = JSON.parse(messageData);
        } catch (e) {
            // If not plain JSON, try decompressing
            const decompressed = decompressData(messageData);
            if (decompressed) {
                try {
                    parsed = JSON.parse(decompressed);
                } catch (jsonErr) {
                    console.error('JSON parse error after decompression:', jsonErr);
                }
            } else {
                 console.warn('Failed to decompress or not compressed');
            }
        }

        if (parsed) {
            handleMessage(parsed);
        }
      } else if (messageData instanceof Blob) {
         console.warn('Received Blob data, handling not implemented');
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      // Exponential Backoff Reconnect
      const delay = Math.min(1000 * (2 ** (reconnectCountRef.current)), 30000); // Max 30s
      reconnectCountRef.current += 1;
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('WebSocket connection error');
    };

  }, [handleMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { data, isConnected, error };
};

