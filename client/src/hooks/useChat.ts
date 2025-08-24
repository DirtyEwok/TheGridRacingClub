import { useEffect, useRef, useState } from "react";
import { type ChatMessageWithMember } from "@shared/schema";

export function useChat(chatRoomId: string | null) {
  const [messages, setMessages] = useState<ChatMessageWithMember[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!chatRoomId) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Join the chat room
      ws.send(JSON.stringify({
        type: 'join-chat-room',
        chatRoomId,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new-message' && data.chatRoomId === chatRoomId) {
          setMessages(prev => [...prev, data.message]);
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [chatRoomId]);

  const sendMessage = (message: string, memberId: string) => {
    if (!chatRoomId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    // Send via HTTP API (which will broadcast via WebSocket)
    fetch(`/api/chat-rooms/${chatRoomId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        memberId,
      }),
    }).catch(error => {
      console.error('Failed to send message:', error);
    });

    return true;
  };

  return {
    messages,
    setMessages,
    isConnected,
    sendMessage,
  };
}