import { NextRequest } from 'next/server';
import { SerialPort } from '@serialport/stream';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { WebSocket, WebSocketServer } from 'ws';

// 全局变量，保存WebSocket服务器实例
let wss: WebSocketServer | null = null;

// 用于存储已连接的串口
const connectedPorts = new Map<string, SerialPort>();

// 初始化WebSocket服务器
function initWebSocketServer() {
  if (wss !== null) return;

  wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');

    // 客户端消息处理
    ws.on('message', async (message: Buffer) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        handleClientMessage(ws, parsedMessage);
      } catch (error) {
        console.error('Error parsing message:', error);
        sendError(ws, 'INVALID_MESSAGE', 'Failed to parse message');
      }
    });

    // 客户端断开连接
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');

      // 断开所有串口连接
      connectedPorts.forEach((port, path) => {
        try {
          if (port.isOpen) {
            port.close();
          }
        } catch (error) {
          console.error(`Error closing port ${path}:`, error);
        }
      });
      connectedPorts.clear();
    });

    // 发送初始连接成功消息
    ws.send(JSON.stringify({ type: 'CONNECTED', payload: { message: 'WebSocket connection established' } }));
  });
}

// 处理客户端消息
async function handleClientMessage(ws: WebSocket, message: any) {
  const { type, payload } = message;

  switch (type) {
    case 'LIST_PORTS':
      await handleListPorts(ws);
      break;
    case 'CONNECT_PORT':
      await handleConnectPort(ws, payload);
      break;
    case 'DISCONNECT_PORT':
      await handleDisconnectPort(ws, payload);
      break;
    case 'SEND_DATA':
      await handleSendData(ws, payload);
      break;
    default:
      sendError(ws, 'UNKNOWN_COMMAND', `Unknown command type: ${type}`);
  }
}

// 列出可用串口
async function handleListPorts(ws: WebSocket) {
  try {
    const ports = await SerialPort.list();
    ws.send(JSON.stringify({
      type: 'PORT_LIST',
      payload: { ports }
    }));
  } catch (error) {
    console.error('Error listing ports:', error);
    sendError(ws, 'LIST_PORTS_FAILED', 'Failed to list serial ports');
  }
}

// 连接串口
async function handleConnectPort(ws: WebSocket, payload: any) {
  const { path, options } = payload;

  try {
    if (connectedPorts.has(path)) {
      sendError(ws, 'SERIAL_PORT_ALREADY_OPEN', `Port ${path} is already open`);
      return;
    }

    const port = new SerialPort({ 
      path, 
      baudRate: options.baudRate,
      dataBits: options.dataBits,
      stopBits: options.stopBits,
      parity: options.parity
    });

    // 设置数据解析器
    const parser = port.pipe(new DelimiterParser({ delimiter: '\r\n' }));

    // 数据接收处理
    parser.on('data', (data) => {
      const dataString = data.toString('utf8');
      ws.send(JSON.stringify({
        type: 'DATA_RECEIVED',
        payload: { path, data: dataString }
      }));
    });

    // 错误处理
    port.on('error', (err) => {
      console.error(`Port ${path} error:`, err);
      sendError(ws, 'SERIAL_PORT_ERROR', err.message);
    });

    // 端口关闭处理
    port.on('close', () => {
      console.log(`Port ${path} closed`);
      connectedPorts.delete(path);
      ws.send(JSON.stringify({
        type: 'PORT_DISCONNECTED',
        payload: { path }
      }));
    });

    // 等待端口打开
    await new Promise<void>((resolve, reject) => {
      port.open((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // 保存已连接的端口
    connectedPorts.set(path, port);

    // 发送连接成功消息
    ws.send(JSON.stringify({
      type: 'PORT_CONNECTED',
      payload: { path }
    }));
  } catch (error) {
    console.error(`Failed to connect to port ${path}:`, error);
    sendError(
      ws, 
      'SERIAL_PORT_ACCESS_DENIED', 
      `Failed to connect to ${path}: ${error.message}`
    );
  }
}

// 断开串口连接
async function handleDisconnectPort(ws: WebSocket, payload: any) {
  const { path } = payload;

  try {
    const port = connectedPorts.get(path);
    if (!port) {
      sendError(ws, 'SERIAL_PORT_NOT_FOUND', `Port ${path} not found or already closed`);
      return;
    }

    // 关闭串口
    if (port.isOpen) {
      port.close((err) => {
        if (err) {
          console.error(`Error closing port ${path}:`, err);
          sendError(ws, 'SERIAL_PORT_CLOSE_ERROR', `Error closing port ${path}: ${err.message}`);
        }
      });
    }

    // 不管关闭成功与否，都移除保存的端口
    connectedPorts.delete(path);

    // 发送断开连接消息
    ws.send(JSON.stringify({
      type: 'PORT_DISCONNECTED',
      payload: { path }
    }));
  } catch (error) {
    console.error(`Failed to disconnect port ${path}:`, error);
    sendError(ws, 'SERIAL_PORT_CLOSE_ERROR', `Failed to disconnect port ${path}: ${error.message}`);
  }
}

// 发送数据到串口
async function handleSendData(ws: WebSocket, payload: any) {
  const { path, data, format } = payload;

  try {
    const port = connectedPorts.get(path);
    if (!port || !port.isOpen) {
      sendError(ws, 'SERIAL_PORT_NOT_FOUND', `Port ${path} not found or not open`);
      return;
    }

    // 根据格式转换数据
    let bufferData: Buffer;
    if (format === 'hex') {
      // 处理十六进制数据
      const hexString = data.replace(/\s+/g, ''); // 移除所有空格
      if (!/^[0-9A-Fa-f]*$/.test(hexString)) {
        sendError(ws, 'DATA_FORMAT_INVALID', 'Invalid hex format');
        return;
      }
      bufferData = Buffer.from(hexString, 'hex');
    } else {
      // 处理文本数据
      bufferData = Buffer.from(data, 'utf8');
    }

    // 发送数据
    port.write(bufferData, (err) => {
      if (err) {
        console.error(`Error sending data to port ${path}:`, err);
        sendError(ws, 'SEND_DATA_ERROR', `Error sending data: ${err.message}`);
      }
    });
  } catch (error) {
    console.error(`Failed to send data to port ${path}:`, error);
    sendError(ws, 'SEND_DATA_ERROR', `Failed to send data: ${error.message}`);
  }
}

// 发送错误消息
function sendError(ws: WebSocket, errorType: string, message: string) {
  ws.send(JSON.stringify({
    type: 'ERROR',
    payload: { errorType, message }
  }));
}

// 处理WebSocket升级请求
export async function GET(req: NextRequest) {
  // 初始化WebSocket服务器
  initWebSocketServer();

  const { socket: res, response } = (req as any);

  if (!res || !wss) {
    return new Response('WebSocket server not available', { status: 500 });
  }

  // 执行WebSocket升级
  const upgradeHeader = req.headers.get('upgrade');
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected websocket', { status: 400 });
  }

  // 这里通过NextResponse对象的socket属性访问原生Response
  res.socket.server.ws = true;

  // 这里执行WebSocket握手
  wss.handleUpgrade(req, res.socket, Buffer.alloc(0), (ws) => {
    wss!.emit('connection', ws, req);
  });

  return response;
}
