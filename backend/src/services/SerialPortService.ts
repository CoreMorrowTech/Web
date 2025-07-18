import { SerialPort as SerialPortLib } from 'serialport';
import { SerialPort, ConnectionOptions, ErrorType } from '../types';

class SerialPortService {
  private static instance: SerialPortService;
  private connectedPorts: Map<string, SerialPortLib> = new Map();
  private dataListeners: Map<string, (data: Buffer) => void> = new Map();

  private constructor() {
    // 私有构造函数，防止直接实例化
  }

  public static getInstance(): SerialPortService {
    if (!SerialPortService.instance) {
      SerialPortService.instance = new SerialPortService();
    }
    return SerialPortService.instance;
  }

  /**
   * 获取可用的串口列表
   */
  public async listPorts(): Promise<SerialPort[]> {
    try {
      const ports = await SerialPortLib.list();
      return ports;
    } catch (error) {
      console.error('Failed to list serial ports:', error);
      throw error;
    }
  }

  /**
   * 连接串口
   * @param path 串口路径
   * @param options 连接选项
   */
  public async connectPort(path: string, options: ConnectionOptions): Promise<void> {
    // 检查串口是否已经连接
    if (this.connectedPorts.has(path)) {
      const error = new Error(`Port ${path} is already open`);
      (error as any).type = ErrorType.SERIAL_PORT_ALREADY_OPEN;
      throw error;
    }

    try {
      // 创建新的串口实例
      const port = new SerialPortLib({
        path,
        baudRate: options.baudRate,
        dataBits: options.dataBits,
        stopBits: options.stopBits,
        parity: options.parity
      });

      // 等待打开
      await new Promise<void>((resolve, reject) => {
        port.on('open', () => {
          resolve();
        });

        port.on('error', (err) => {
          reject(err);
        });
      });

      // 存储连接的串口
      this.connectedPorts.set(path, port);

      // 添加数据接收监听器
      port.on('data', (data: Buffer) => {
        const listener = this.dataListeners.get(path);
        if (listener) {
          listener(data);
        }
      });

      // 添加关闭监听器
      port.on('close', () => {
        this.connectedPorts.delete(path);
        this.dataListeners.delete(path);
      });

      console.log(`Connected to port ${path}`);
    } catch (error) {
      console.error(`Failed to connect to port ${path}:`, error);

      // 根据错误类型设置自定义错误
      let customError;
      if ((error as any).code === 'EACCES') {
        customError = new Error(`Access denied to port ${path}`);
        (customError as any).type = ErrorType.SERIAL_PORT_ACCESS_DENIED;
      } else if ((error as any).code === 'ENOENT') {
        customError = new Error(`Port ${path} not found`);
        (customError as any).type = ErrorType.SERIAL_PORT_NOT_FOUND;
      } else {
        customError = error;
      }

      throw customError;
    }
  }

  /**
   * 断开串口连接
   * @param path 串口路径
   */
  public async disconnectPort(path: string): Promise<void> {
    const port = this.connectedPorts.get(path);
    if (!port) {
      const error = new Error(`Port ${path} is not connected`);
      (error as any).type = ErrorType.SERIAL_PORT_NOT_FOUND;
      throw error;
    }

    try {
      // 关闭串口
      await new Promise<void>((resolve, reject) => {
        port.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      this.connectedPorts.delete(path);
      this.dataListeners.delete(path);
      console.log(`Disconnected from port ${path}`);
    } catch (error) {
      console.error(`Failed to disconnect from port ${path}:`, error);
      throw error;
    }
  }

  /**
   * 发送数据到串口
   * @param path 串口路径
   * @param data 要发送的数据
   * @param format 数据格式，'text'或'hex'
   */
  public async sendData(path: string, data: string, format: 'text' | 'hex' = 'text'): Promise<void> {
    const port = this.connectedPorts.get(path);
    if (!port) {
      const error = new Error(`Port ${path} is not connected`);
      (error as any).type = ErrorType.SERIAL_PORT_NOT_FOUND;
      throw error;
    }

    try {
      let buffer: Buffer;

      // 根据格式转换数据
      if (format === 'hex') {
        // 处理十六进制字符串，移除空格
        const hexString = data.replace(/\s+/g, '');
        if (!/^[0-9A-Fa-f]*$/.test(hexString)) {
          const error = new Error('Invalid hex data format');
          (error as any).type = ErrorType.DATA_FORMAT_INVALID;
          throw error;
        }

        // 转换为Buffer
        buffer = Buffer.from(hexString, 'hex');
      } else {
        // 文本格式直接转换为Buffer
        buffer = Buffer.from(data);
      }

      // 发送数据
      await new Promise<void>((resolve, reject) => {
        port.write(buffer, (err) => {
          if (err) {
            reject(err);
          } else {
            port.drain((err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          }
        });
      });

      console.log(`Data sent to port ${path}: ${buffer.toString('hex')}`);
    } catch (error) {
      console.error(`Failed to send data to port ${path}:`, error);
      throw error;
    }
  }

  /**
   * 注册数据接收回调
   * @param path 串口路径
   * @param callback 回调函数
   */
  public onDataReceived(path: string, callback: (data: Buffer) => void): void {
    this.dataListeners.set(path, callback);
  }

  /**
   * 检查串口是否已连接
   * @param path 串口路径
   */
  public isConnected(path: string): boolean {
    return this.connectedPorts.has(path);
  }

  /**
   * 获取所有已连接串口的路径
   */
  public getConnectedPorts(): string[] {
    return Array.from(this.connectedPorts.keys());
  }
}

export default SerialPortService.getInstance();
