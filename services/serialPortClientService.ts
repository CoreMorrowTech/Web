"use client"

import { SerialPort } from '@/types/serialPort';
import WebSocketService from './websocketService';

class SerialPortClientService {
  private static instance: SerialPortClientService;
  private isVercelEnv: boolean = false;
  private apiBaseUrl: string = '';

  private constructor() {
    // 检测是否在Vercel环境中
    this.isVercelEnv = typeof window !== 'undefined' && 
                      (window.location.hostname.endsWith('vercel.app') ||
                       window.location.hostname === 'localhost');

    // 设置API基础URL
    this.apiBaseUrl = this.isVercelEnv ? '/api/serial-ports' : '/api/ws';
  }

  public static getInstance(): SerialPortClientService {
    if (!SerialPortClientService.instance) {
      SerialPortClientService.instance = new SerialPortClientService();
    }
    return SerialPortClientService.instance;
  }

  // 获取串口列表
  public async getSerialPorts(): Promise<SerialPort[]> {
    if (this.isVercelEnv) {
      // 在Vercel环境中使用REST API
      try {
        const response = await fetch(this.apiBaseUrl);
        const data = await response.json();
        return data.payload.ports;
      } catch (error) {
        console.error('获取串口列表失败:', error);
        return [];
      }
    } else {
      // 在本地环境中使用WebSocket
      return new Promise((resolve) => {
        const { sendMessage, addMessageHandler, removeMessageHandler } = WebSocketService || {};

        if (!sendMessage) {
          console.error('WebSocket服务不可用');
          resolve([]);
          return;
        }

        // 处理一次性消息
        const handlePortList = (message: any) => {
          if (message.type === 'PORT_LIST') {
            removeMessageHandler('PORT_LIST', handlePortList);
            resolve(message.payload.ports);
          }
        };

        // 添加消息处理器
        addMessageHandler('PORT_LIST', handlePortList);

        // 发送获取端口列表请求
        sendMessage({
          type: 'LIST_PORTS',
          payload: {}
        });

        // 5秒超时
        setTimeout(() => {
          removeMessageHandler('PORT_LIST', handlePortList);
          console.warn('获取串口列表超时');
          resolve([]);
        }, 5000);
      });
    }
  }

  // 连接串口
  public async connectPort(path: string, options: any): Promise<boolean> {
    if (this.isVercelEnv) {
      // 在Vercel环境中模拟连接
      try {
        const response = await fetch(this.apiBaseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'CONNECT_PORT',
            payload: { path, options }
          }),
        });
        return response.ok;
      } catch (error) {
        console.error('串口连接失败:', error);
        return false;
      }
    } else {
      // 在本地环境中使用WebSocket
      if (!WebSocketService) {
        console.error('WebSocket服务不可用');
        return false;
      }

      WebSocketService.sendMessage({
        type: 'CONNECT_PORT',
        payload: { path, options }
      });
      return true;
    }
  }

  // 断开串口连接
  public async disconnectPort(path: string): Promise<boolean> {
    if (this.isVercelEnv) {
      // 在Vercel环境中模拟断开连接
      try {
        const response = await fetch(this.apiBaseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'DISCONNECT_PORT',
            payload: { path }
          }),
        });
        return response.ok;
      } catch (error) {
        console.error('断开串口连接失败:', error);
        return false;
      }
    } else {
      // 在本地环境中使用WebSocket
      if (!WebSocketService) {
        console.error('WebSocket服务不可用');
        return false;
      }

      WebSocketService.sendMessage({
        type: 'DISCONNECT_PORT',
        payload: { path }
      });
      return true;
    }
  }

  // 发送数据
  public async sendData(path: string, data: string, format: 'text' | 'hex'): Promise<boolean> {
    if (this.isVercelEnv) {
      // 在Vercel环境中模拟发送数据
      try {
        const response = await fetch(this.apiBaseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'SEND_DATA',
            payload: { path, data, format }
          }),
        });
        return response.ok;
      } catch (error) {
        console.error('发送数据失败:', error);
        return false;
      }
    } else {
      // 在本地环境中使用WebSocket
      if (!WebSocketService) {
        console.error('WebSocket服务不可用');
        return false;
      }

      WebSocketService.sendMessage({
        type: 'SEND_DATA',
        payload: { path, data, format }
      });
      return true;
    }
  }
}

export default typeof window !== 'undefined' ? SerialPortClientService.getInstance() : null;
