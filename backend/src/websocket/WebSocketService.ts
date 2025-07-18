import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import SerialPortService from '../services/SerialPortService';
import { 
  ClientMessage, 
  ServerMessage, 
  SerialPort,
  ErrorType 
} from '../types';

class WebSocketService {
  private static instance: WebSocketService;
  private wss: WebSocket.Server | null = null;
  private clientSessions: Map<WebSocket, string> = new Map(); // WebSocket到客户端ID的映射

  private constructor() {
    // 私有构造函数，防止直接实例化
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * 初始化WebSocket服务器
   * @param server HTTP服务器实例或端口号
   */
  public init(server: WebSocket.ServerOptions['server'] | number): void {
    // 如果已经初始化，先关闭现有的服务器
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    // 创建WebSocket服务器
    this.wss = new WebSocket.Server(
      typeof server === 'number' ? { port: server } : { server }
    );

    // 处理新的连接
    this.wss.on('connection', this.handleConnection.bind(this));

    console.log('WebSocket server initialized');
  }

  /**
   * 关闭WebSocket服务器
   */
  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.wss) {
        resolve();
        return;
      }

      this.wss.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.wss = null;
          resolve();
        }
      });
    });
  }

  /**
   * 处理新的WebSocket连接
   * @param ws WebSocket实例
   * @param req HTTP请求
   */
  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    // 为客户端分配唯一ID（这里使用IP地址作为ID，实际应用中可能需要更复杂的标识）
    const clientId = req.socket.remoteAddress || 'unknown';
    this.clientSessions.set(ws, clientId);

    console.log(`New WebSocket connection from ${clientId}`);

    // 处理消息
    ws.on('message', (message: WebSocket.RawData) => {
      try {
        const parsedMessage: ClientMessage = JSON.parse(message.toString());
        this.handleClientMessage(ws, parsedMessage);
      } catch (error) {
        console.error('Failed to parse client message:', error);
        this.sendErrorToClient(ws, 'Invalid message format', ErrorType.DATA_FORMAT_INVALID);
      }
    });

    // 处理关闭
    ws.on('close', () => {
      console.log(`WebSocket connection closed from ${clientId}`);
      this.clientSessions.delete(ws);
    });

    // 处理错误
    ws.on('error', (error) => {
      console.error(`WebSocket error from ${clientId}:`, error);
    });
  }

  /**
   * 处理客户端消息
   * @param ws WebSocket实例
   * @param message 客户端消息
   */
  private async handleClientMessage(ws: WebSocket, message: ClientMessage): Promise<void> {
    console.log(`Received message: ${message.type}`, message.payload);

    try {
      switch (message.type) {
        case 'LIST_PORTS':
          await this.handleListPorts(ws);
          break;

        case 'CONNECT_PORT':
          await this.handleConnectPort(ws, message.payload);
          break;

        case 'DISCONNECT_PORT':
          await this.handleDisconnectPort(ws, message.payload);
          break;

        case 'SEND_DATA':
          await this.handleSendData(ws, message.payload);
          break;

        default:
          console.warn(`Unsupported message type: ${(message as any).type}`);
          this.sendErrorToClient(ws, `Unsupported message type: ${(message as any).type}`, ErrorType.DATA_FORMAT_INVALID);
      }
    } catch (error) {
      console.error(`Error handling message ${message.type}:`, error);
      this.sendErrorToClient(ws, (error as Error).message, (error as any).type || ErrorType.WEBSOCKET_CONNECTION_FAILED);
    }
  }

  /**
   * 处理获取串口列表请求
   * @param ws WebSocket实例
   */
  private async handleListPorts(ws: WebSocket): Promise<void> {
    try {
      const ports = await SerialPortService.listPorts();
      this.sendToClient(ws, {
        type: 'PORT_LIST',
        payload: { ports }
      });
    } catch (error) {
      console.error('Failed to list ports:', error);
      this.sendErrorToClient(ws, 'Failed to list ports', ErrorType.WEBSOCKET_CONNECTION_FAILED);
    }
  }

  /**
   * 处理连接串口请求
   * @param ws WebSocket实例
   * @param payload 请求载荷
   */
  private async handleConnectPort(ws: WebSocket, payload: any): Promise<void> {
    const { path, options } = payload;

    if (!path) {
      this.sendErrorToClient(ws, 'Port path is required', ErrorType.DATA_FORMAT_INVALID);
      return;
    }

    try {
      await SerialPortService.connectPort(path, options);

      // 注册数据接收回调
      SerialPortService.onDataReceived(path, (data) => {
        this.sendToClient(ws, {
          type: 'DATA_RECEIVED',
          payload: { 
            path, 
            data: data.toString('utf-8') 
          }
        });
      });

      this.sendToClient(ws, {
        type: 'PORT_CONNECTED',
        payload: { path }
      });
    } catch (error) {
      console.error(`Failed to connect to port ${path}:`, error);
      this.sendErrorToClient(
        ws, 
        `Failed to connect to port ${path}: ${(error as Error).message}`, 
        (error as any).type || ErrorType.SERIAL_PORT_ACCESS_DENIED
      );
    }
  }

  /**
   * 处理断开串口连接请求
   * @param ws WebSocket实例
   * @param payload 请求载荷
   */
  private async handleDisconnectPort(ws: WebSocket, payload: any): Promise<void> {
    const { path } = payload;

    if (!path) {
      this.sendErrorToClient(ws, 'Port path is required', ErrorType.DATA_FORMAT_INVALID);
      return;
    }

    try {
      await SerialPortService.disconnectPort(path);

      this.sendToClient(ws, {
        type: 'PORT_DISCONNECTED',
        payload: { path }
      });
    } catch (error) {
      console.error(`Failed to disconnect from port ${path}:`, error);
      this.sendErrorToClient(
        ws, 
        `Failed to disconnect from port ${path}: ${(error as Error).message}`, 
        (error as any).type || ErrorType.SERIAL_PORT_NOT_FOUND
      );
    }
  }

  /**
   * 处理发送数据请求
   * @param ws WebSocket实例
   * @param payload 请求载荷
   */
  private async handleSendData(ws: WebSocket, payload: any): Promise<void> {
    const { path, data, format } = payload;

    if (!path || data === undefined) {
      this.sendErrorToClient(ws, 'Port path and data are required', ErrorType.DATA_FORMAT_INVALID);
      return;
    }

    try {
      await SerialPortService.sendData(path, data, format || 'text');
      // 发送成功不需要特殊回复
    } catch (error) {
      console.error(`Failed to send data to port ${path}:`, error);
      this.sendErrorToClient(
        ws, 
        `Failed to send data to port ${path}: ${(error as Error).message}`, 
        (error as any).type || ErrorType.SERIAL_PORT_NOT_FOUND
      );
    }
  }

  /**
   * 向客户端发送消息
   * @param ws WebSocket实例
   * @param message 服务端消息
   */
  private sendToClient(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * 向客户端发送错误消息
   * @param ws WebSocket实例
   * @param errorMessage 错误信息
   * @param errorType 错误类型
   */
  private sendErrorToClient(ws: WebSocket, errorMessage: string, errorType: ErrorType): void {
    this.sendToClient(ws, {
      type: 'ERROR',
      payload: { message: errorMessage, errorType }
    });
  }

  /**
   * 广播消息到所有连接的客户端
   * @param message 服务端消息
   */
  public broadcast(message: ServerMessage): void {
    if (!this.wss) return;

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  /**
   * 获取连接的客户端数量
   */
  public getClientCount(): number {
    return this.wss ? this.wss.clients.size : 0;
  }
}

export default WebSocketService.getInstance();
