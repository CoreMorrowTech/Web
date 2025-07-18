"use client"

import { create } from 'zustand';
import WebSocketService from '@/services/websocketService';
import { ClientMessage, ServerMessage } from '@/types/websocket';

interface WebSocketState {
  isConnected: boolean;
  connect: (url: string) => void;
  disconnect: () => void;
  sendMessage: (message: ClientMessage) => void;
  addMessageHandler: (type: string, handler: (message: ServerMessage) => void) => void;
  removeMessageHandler: (type: string, handler: (message: ServerMessage) => void) => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  isConnected: false,

  connect: (url: string) => {
    if (!WebSocketService) return; // 防止服务端渲染时调用
    WebSocketService.addConnectionHandler((connected) => {
      set({ isConnected: connected });
    });
    WebSocketService.connect(url);
  },

  disconnect: () => {
    if (!WebSocketService) return;
    WebSocketService.disconnect();
  },

  sendMessage: (message: ClientMessage) => {
    if (!WebSocketService) return;
    WebSocketService.sendMessage(message);
  },

  addMessageHandler: (type: string, handler: (message: ServerMessage) => void) => {
    if (!WebSocketService) return;
    WebSocketService.addMessageHandler(type, handler);
  },

  removeMessageHandler: (type: string, handler: (message: ServerMessage) => void) => {
    if (!WebSocketService) return;
    WebSocketService.removeMessageHandler(type, handler);
  }
}));
