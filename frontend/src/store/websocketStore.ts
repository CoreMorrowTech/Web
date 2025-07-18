import { create } from 'zustand';
import WebSocketService from '../services/websocketService';
import { ClientMessage, ServerMessage } from '../types/websocket';

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
    WebSocketService.addConnectionHandler((connected) => {
      set({ isConnected: connected });
    });
    WebSocketService.connect(url);
  },

  disconnect: () => {
    WebSocketService.disconnect();
  },

  sendMessage: (message: ClientMessage) => {
    WebSocketService.sendMessage(message);
  },

  addMessageHandler: (type: string, handler: (message: ServerMessage) => void) => {
    WebSocketService.addMessageHandler(type, handler);
  },

  removeMessageHandler: (type: string, handler: (message: ServerMessage) => void) => {
    WebSocketService.removeMessageHandler(type, handler);
  }
}));
