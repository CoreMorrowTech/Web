import AppService from './services/AppService';
import WebSocketService from './websocket/WebSocketService';
import SerialPortService from './services/SerialPortService';
import path from 'path';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const STATIC_PATH = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '../public')
  : undefined;

async function main() {
  try {
    // 配置应用服务
    AppService.configure(PORT, STATIC_PATH);

    // 启动服务器
    await AppService.start();

    console.log(`
========================================
  串口通讯Web管理平台服务已启动
----------------------------------------
  访问地址: http://localhost:${PORT}
  WebSocket: ws://localhost:${PORT}/ws
========================================
    `);

    // 处理进程退出信号
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function shutdown() {
  console.log('Shutting down server...');

  try {
    // 断开所有串口连接
    const connectedPorts = SerialPortService.getConnectedPorts();
    for (const port of connectedPorts) {
      try {
        await SerialPortService.disconnectPort(port);
      } catch (error) {
        console.error(`Failed to disconnect from port ${port}:`, error);
      }
    }

    // 停止应用服务
    await AppService.stop();
    console.log('Server shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// 启动应用
main();
