const WebSocket = require('ws');
const { SerialPort } = require('serialport');
const { DelimiterParser } = require('@serialport/parser-delimiter');

// 创建WebSocket服务器
const wss = new WebSocket.Server({ port: 8080 });
console.log('串口WebSocket服务器运行在: ws://localhost:8080');

// 存储已连接的串口
const connectedPorts = new Map();

// 客户端连接处理
wss.on('connection', (ws) => {
  console.log('前端已连接到WebSocket服务器');

  // 客户端消息处理
  ws.on('message', async (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      await handleClientMessage(ws, parsedMessage);
    } catch (error) {
      console.error('消息解析错误:', error);
      sendError(ws, 'INVALID_MESSAGE', '消息解析失败');
    }
  });

  // 客户端断开连接
  ws.on('close', () => {
    console.log('前端已断开连接');

    // 断开所有串口连接
    connectedPorts.forEach((port, path) => {
      try {
        if (port.isOpen) {
          port.close();
        }
      } catch (error) {
        console.error(`关闭串口 ${path} 错误:`, error);
      }
    });
    connectedPorts.clear();
  });

  // 发送初始连接成功消息
  ws.send(JSON.stringify({ 
    type: 'CONNECTED', 
    payload: { message: 'WebSocket连接已建立' } 
  }));
});

// 处理客户端消息
async function handleClientMessage(ws, message) {
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
      sendError(ws, 'UNKNOWN_COMMAND', `未知命令类型: ${type}`);
  }
}

// 列出可用串口
async function handleListPorts(ws) {
  try {
    const ports = await SerialPort.list();
    ws.send(JSON.stringify({
      type: 'PORT_LIST',
      payload: { ports }
    }));
  } catch (error) {
    console.error('列出串口错误:', error);
    sendError(ws, 'LIST_PORTS_FAILED', '获取串口列表失败');
  }
}

// 连接串口
async function handleConnectPort(ws, payload) {
  const { path, options } = payload;

  try {
    if (connectedPorts.has(path)) {
      sendError(ws, 'SERIAL_PORT_ALREADY_OPEN', `串口 ${path} 已经打开`);
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
      console.error(`串口 ${path} 错误:`, err);
      sendError(ws, 'SERIAL_PORT_ERROR', err.message);
    });

    // 端口关闭处理
    port.on('close', () => {
      console.log(`串口 ${path} 已关闭`);
      connectedPorts.delete(path);
      ws.send(JSON.stringify({
        type: 'PORT_DISCONNECTED',
        payload: { path }
      }));
    });

    // 等待端口打开
    await new Promise((resolve, reject) => {
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
    console.error(`连接到串口 ${path} 失败:`, error);
    sendError(
      ws,
      'SERIAL_PORT_ACCESS_DENIED',
      `连接到 ${path} 失败: ${error.message}`
    );
  }
}

// 断开串口连接
async function handleDisconnectPort(ws, payload) {
  const { path } = payload;

  try {
    const port = connectedPorts.get(path);
    if (!port) {
      sendError(ws, 'SERIAL_PORT_NOT_FOUND', `串口 ${path} 未找到或已关闭`);
      return;
    }

    // 关闭串口
    if (port.isOpen) {
      port.close((err) => {
        if (err) {
          console.error(`关闭串口 ${path} 错误:`, err);
          sendError(ws, 'SERIAL_PORT_CLOSE_ERROR', `关闭串口 ${path} 错误: ${err.message}`);
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
    console.error(`断开串口 ${path} 连接失败:`, error);
    sendError(ws, 'SERIAL_PORT_CLOSE_ERROR', `断开串口 ${path} 连接失败: ${error.message}`);
  }
}

// 发送数据到串口
async function handleSendData(ws, payload) {
  const { path, data, format } = payload;

  try {
    const port = connectedPorts.get(path);
    if (!port || !port.isOpen) {
      sendError(ws, 'SERIAL_PORT_NOT_FOUND', `串口 ${path} 未找到或未打开`);
      return;
    }

    // 根据格式转换数据
    let bufferData;
    if (format === 'hex') {
      // 处理十六进制数据
      const hexString = data.replace(/\s+/g, ''); // 移除所有空格
      if (!/^[0-9A-Fa-f]*$/.test(hexString)) {
        sendError(ws, 'DATA_FORMAT_INVALID', '无效的十六进制格式');
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
        console.error(`向串口 ${path} 发送数据错误:`, err);
        sendError(ws, 'SEND_DATA_ERROR', `发送数据错误: ${err.message}`);
      }
    });
  } catch (error) {
    console.error(`向串口 ${path} 发送数据失败:`, error);
    sendError(ws, 'SEND_DATA_ERROR', `发送数据失败: ${error.message}`);
  }
}

// 发送错误消息
function sendError(ws, errorType, message) {
  ws.send(JSON.stringify({
    type: 'ERROR',
    payload: { errorType, message }
  }));
}
