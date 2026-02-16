import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WebSocketMessage } from '@/types';
import { authApi } from '@/api';
import { toast } from 'react-toastify';

interface UseWebSocketOptions {
  sessionId?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    sessionId,
    onMessage,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    const token = authApi.getToken();
    if (!token) {
      console.warn('No auth token available for WebSocket connection');
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    let url = `${protocol}//${host}?token=${token}`;

    if (sessionId) {
      url += `&sessionId=${sessionId}`;
    }

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectCountRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          // Update query cache based on message type
          if (message.type === 'progress' || message.type === 'phase') {
            queryClient.invalidateQueries({ queryKey: ['session', message.sessionId] });
          } else if (message.type === 'completed') {
            queryClient.invalidateQueries({ queryKey: ['session', message.sessionId] });
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
            queryClient.invalidateQueries({ queryKey: ['session-stats'] });
            toast.success('Agent creation completed!');
          } else if (message.type === 'error') {
            queryClient.invalidateQueries({ queryKey: ['session', message.sessionId] });
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
            toast.error(`Agent creation failed: ${message.data.error}`);
          }

          // Call custom handler
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        if (onError) {
          onError(error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnection
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          console.log(`Reconnecting... (${reconnectCountRef.current}/${reconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
        } else {
          console.error('Max reconnection attempts reached');
          toast.error('Lost connection to server. Please refresh the page.');
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [sessionId, onMessage, onError, reconnectAttempts, reconnectInterval, queryClient]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const send = useCallback((data: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    send,
    disconnect,
    reconnect: connect,
  };
};
