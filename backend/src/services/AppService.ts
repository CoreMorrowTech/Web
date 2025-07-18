import express from 'express';
import http from 'http';
import path from 'path';
import WebSocketService from '../websocket/WebSocketService';

class AppService {
  private static instance: AppService;
  private app: express.Application;
  private server: http.Server | null = null;
  private port: number = 8080;

  private constructor() {
    this.app = express();
  }

  public static getInstance(): AppService {
    if (!AppService.instance) {
      AppService.instance = new AppService();
    }
    return AppService.instance;
  }

  /**
   * 配置应用服务器
   * @param port 服务器端口号
   * @param staticPath 静态文件目录路径（开发模式下可能不需要）
   */
  public configure(port: number, staticPath?: string): void {
    this.port = port;

    // 配置静态文件服务
    if (staticPath) {
      const absolutePath = path.resolve(staticPath);
      console.log(`Serving static files from ${absolutePath}`);
      this.app.use(express.static(absolutePath));

      // 所有未匹配的路由都返回index.html（SPA支持）
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(absolutePath, 'index.html'));
      });
    }
  }

  /**
   * 启动应用服务器
   */
  public async start(): Promise<void> {
    // 创建HTTP服务器
    this.server = http.createServer(this.app);

    // 初始化WebSocket服务
    WebSocketService.init(this.server);

    // 启动服务器
    return new Promise((resolve) => {
      if (this.server) {
        this.server.listen(this.port, () => {
          console.log(`Server is running on port ${this.port}`);
          resolve();
        });
      } else {
        throw new Error('Server has not been initialized');
      }
    });
  }

  /**
   * 停止应用服务器
   */
  public async stop(): Promise<void> {
    // 关闭WebSocket服务
    await WebSocketService.close();

    // 关闭HTTP服务器
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Server has been stopped');
            this.server = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * 获取Express应用实例
   */
  public getApp(): express.Application {
    return this.app;
  }

  /**
   * 获取HTTP服务器实例
   */
  public getServer(): http.Server | null {
    return this.server;
  }
}

export default AppService.getInstance();
