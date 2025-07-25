"use client"

import { create } from 'zustand';
import { useWebSocketStore } from './websocketStore';
import { SerialPort, ConnectionOptions, ConnectionStatus, DataFormat } from '@/types/serialPort';
import SerialPortClientService from '@/services/serialPortClientService';

interface SerialPortState {
  // 状态
  ports: SerialPort[];
  selectedPort: SerialPort | null;
  connectionStatus: ConnectionStatus;
  connectionOptions: ConnectionOptions;
  receivedData: string[];

  // 操作方法
  fetchPorts: () => Promise<void>;
  setSelectedPort: (port: SerialPort | null) => void;
  connectPort: (options?: Partial<ConnectionOptions>) => Promise<void>;
  disconnectPort: () => Promise<void>;
  sendData: (data: string, format: DataFormat) => Promise<void>;
  clearReceivedData: () => void;
  setConnectionOptions: (options: Partial<ConnectionOptions>) => void;
}

// 默认连接选项
const defaultConnectionOptions: ConnectionOptions = {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none'
};

export const useSerialPortStore = create<SerialPortState>((set, get) => {
  // 初始化时设置WebSocket消息处理器
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      const { addMessageHandler } = useWebSocketStore.getState();

      // 处理PORT_LIST消息
      addMessageHandler('PORT_LIST', (message) => {
        set({ ports: message.payload.ports });
      });

      // 处理PORT_CONNECTED消息
      addMessageHandler('PORT_CONNECTED', (message) => {
        set({ connectionStatus: 'connected' });
      });

      // 处理PORT_DISCONNECTED消息
      addMessageHandler('PORT_DISCONNECTED', () => {
        set({ connectionStatus: 'disconnected' });
      });

      // 处理DATA_RECEIVED消息
      addMessageHandler('DATA_RECEIVED', (message) => {
        const { receivedData } = get();
        set({
          receivedData: [...receivedData, message.payload.data]
        });
      });

      // 处理ERROR消息
      addMessageHandler('ERROR', (message) => {
        console.error('Serial port error:', message.payload);
        // 如果是连接错误，更新连接状态
        if (message.payload.errorType === 'SERIAL_PORT_ACCESS_DENIED' ||
            message.payload.errorType === 'SERIAL_PORT_NOT_FOUND') {
          set({ connectionStatus: 'disconnected' });
        }
      });
    }, 0);
  }

  return {
    // 初始状态
    ports: [],
    selectedPort: null,
    connectionStatus: 'disconnected',
    connectionOptions: defaultConnectionOptions,
    receivedData: [],

    // 获取可用串口列表
    fetchPorts: async () => {
      // 使用新的客户端服务
      if (SerialPortClientService) {
        try {
          const ports = await SerialPortClientService.getSerialPorts();
          set({ ports });
        } catch (error) {
          console.error('Failed to fetch ports:', error);
          // 如果失败，回退到原始WebSocket方法
          const { sendMessage } = useWebSocketStore.getState();
          sendMessage?.({
            type: 'LIST_PORTS',
            payload: {}
          });
        }
      } else {
        // 回退到原始WebSocket方法
        const { sendMessage } = useWebSocketStore.getState();
        sendMessage?.({
          type: 'LIST_PORTS',
          payload: {}
        });
      }

      return Promise.resolve();
    },

    // 设置选中的串口
    setSelectedPort: (port) => {
      set({ selectedPort: port });
    },

    // 连接串口
    connectPort: async (options = {}) => {
      const { selectedPort, connectionOptions } = get();

      if (!selectedPort) {
        throw new Error('No port selected');
      }

      // 合并连接选项
      const mergedOptions = { ...connectionOptions, ...options };
      set({ connectionStatus: 'connecting', connectionOptions: mergedOptions });

      if (SerialPortClientService) {
        try {
          await SerialPortClientService.connectPort(selectedPort.path, mergedOptions);
        } catch (error) {
          console.error('Connection failed:', error);
          // 回退到原始方法
          const { sendMessage } = useWebSocketStore.getState();
          sendMessage?.({
            type: 'CONNECT_PORT',
            payload: {
              path: selectedPort.path,
              options: mergedOptions
            }
          });
        }
      } else {
        // 回退到原始方法
        const { sendMessage } = useWebSocketStore.getState();
        sendMessage?.({
          type: 'CONNECT_PORT',
          payload: {
            path: selectedPort.path,
            options: mergedOptions
          }
        });
      }

      return Promise.resolve();
    },

    // 断开串口连接
    disconnectPort: async () => {
      const { selectedPort } = get();

      if (!selectedPort) {
        throw new Error('No port selected');
      }

      if (SerialPortClientService) {
        try {
          await SerialPortClientService.disconnectPort(selectedPort.path);
        } catch (error) {
          console.error('Disconnection failed:', error);
          // 回退到原始方法
          const { sendMessage } = useWebSocketStore.getState();
          sendMessage?.({
            type: 'DISCONNECT_PORT',
            payload: {
              path: selectedPort.path
            }
          });
        }
      } else {
        // 回退到原始方法
        const { sendMessage } = useWebSocketStore.getState();
        sendMessage?.({
          type: 'DISCONNECT_PORT',
          payload: {
            path: selectedPort.path
          }
        });
      }

      return Promise.resolve();
    },

    // 发送数据到串口
    sendData: async (data, format) => {
      const { selectedPort } = get();

      if (!selectedPort) {
        throw new Error('No port selected');
      }

      if (SerialPortClientService) {
        try {
          await SerialPortClientService.sendData(selectedPort.path, data, format);
        } catch (error) {
          console.error('Sending data failed:', error);
          // 回退到原始方法
          const { sendMessage } = useWebSocketStore.getState();
          sendMessage?.({
            type: 'SEND_DATA',
            payload: {
              path: selectedPort.path,
              data,
              format
            }
          });
        }
      } else {
        // 回退到原始方法
        const { sendMessage } = useWebSocketStore.getState();
        sendMessage?.({
          type: 'SEND_DATA',
          payload: {
            path: selectedPort.path,
            data,
            format
          }
        });
      }

      return Promise.resolve();
    },

    // 清空接收数据
    clearReceivedData: () => {
      set({ receivedData: [] });
    },

    // 设置连接选项
    setConnectionOptions: (options) => {
      const { connectionOptions } = get();
      set({
        connectionOptions: { ...connectionOptions, ...options }
      });
    }
  };
});
