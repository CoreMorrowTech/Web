"use client"

import { ClientMessage, ServerMessage } from '@/types/websocket';

class WebSocketService {
  private static instance: WebSocketService;
  private websocket: WebSocket | null = null;
  private messageHandlers: Map<string, ((message: ServerMessage) => void)[]> = new Map();
  private connectionHandlers: ((connected: boolean) => void)[] = [];
  private reconnectTimeout: number | null = null;
  private url: string = '';

  private constructor() {
    // 单例模式，防止多次实例化
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(url: string): void {
    // 在Next.js中使用WebSocket需要保证在客户端执行
    if (typeof window === 'undefined') return;

    this.url = url;
    if (this.websocket) {
      this.disconnect();
    }

    this.websocket = new WebSocket(url);

    this.websocket.onopen = () => {
      console.log('WebSocket connection established');
      this.notifyConnectionHandlers(true);
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    };

    this.websocket.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.websocket.onclose = () => {
      console.log('WebSocket connection closed');
      this.notifyConnectionHandlers(false);
      this.scheduleReconnect();
    };
  }

  public disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  public isConnected(): boolean {
    return this.websocket !== null && this.websocket.readyState === WebSocket.OPEN;
  }

  public sendMessage(message: ClientMessage): void {
    if (this.isConnected() && this.websocket) {
      this.websocket.send(JSON.stringify(message));
    } else {
      console.error('Cannot send message, WebSocket is not connected');
    }
  }

  public addMessageHandler(type: string, handler: (message: ServerMessage) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)?.push(handler);
  }

  public removeMessageHandler(type: string, handler: (message: ServerMessage) => void): void {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    }
  }

  public addConnectionHandler(handler: (connected: boolean) => void): void {
    this.connectionHandlers.push(handler);
    // 立即通知当前连接状态
    handler(this.isConnected());
  }

  public removeConnectionHandler(handler: (connected: boolean) => void): void {
    const index = this.connectionHandlers.indexOf(handler);
    if (index !== -1) {
      this.connectionHandlers.splice(index, 1);
    }
  }

  private handleMessage(message: ServerMessage): void {
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error(`Error in message handler for type ${message.type}:`, error);
      }
    });
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  private scheduleReconnect(): void {
    if (!this.reconnectTimeout && typeof window !== 'undefined') {
      // 5秒后尝试重连
      this.reconnectTimeout = window.setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        this.connect(this.url);
        this.reconnectTimeout = null;
      }, 5000);
    }
  }
}

// 导出单例实例
export default typeof window !== 'undefined' ? WebSocketService.getInstance() : null;
