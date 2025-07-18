import { create } from 'zustand';
import { useWebSocketStore } from './websocketStore';
import { SerialPort, ConnectionOptions, ConnectionStatus } from '../types/serialPort';

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
  sendData: (data: string, format: 'text' | 'hex') => Promise<void>;
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

  return {
    // 初始状态
    ports: [],
    selectedPort: null,
    connectionStatus: 'disconnected',
    connectionOptions: defaultConnectionOptions,
    receivedData: [],

    // 获取可用串口列表
    fetchPorts: async () => {
      const { sendMessage } = useWebSocketStore.getState();
      sendMessage({
        type: 'LIST_PORTS',
        payload: {}
      });
      return Promise.resolve();
    },

    // 设置选中的串口
    setSelectedPort: (port) => {
      set({ selectedPort: port });
    },

    // 连接串口
    connectPort: async (options = {}) => {
      const { selectedPort, connectionOptions } = get();
      const { sendMessage } = useWebSocketStore.getState();

      if (!selectedPort) {
        throw new Error('No port selected');
      }

      // 合并连接选项
      const mergedOptions = { ...connectionOptions, ...options };
      set({ connectionStatus: 'connecting', connectionOptions: mergedOptions });

      sendMessage({
        type: 'CONNECT_PORT',
        payload: {
          path: selectedPort.path,
          options: mergedOptions
        }
      });

      return Promise.resolve();
    },

    // 断开串口连接
    disconnectPort: async () => {
      const { selectedPort } = get();
      const { sendMessage } = useWebSocketStore.getState();

      if (!selectedPort) {
        throw new Error('No port selected');
      }

      sendMessage({
        type: 'DISCONNECT_PORT',
        payload: {
          path: selectedPort.path
        }
      });

      return Promise.resolve();
    },

    // 发送数据到串口
    sendData: async (data, format) => {
      const { selectedPort } = get();
      const { sendMessage } = useWebSocketStore.getState();

      if (!selectedPort) {
        throw new Error('No port selected');
      }

      sendMessage({
        type: 'SEND_DATA',
        payload: {
          path: selectedPort.path,
          data,
          format
        }
      });

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
