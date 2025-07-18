// 串口设备接口
export interface SerialPort {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  productId?: string;
  vendorId?: string;
}

// 串口连接选项接口
export interface ConnectionOptions {
  baudRate: number;
  dataBits: 5 | 6 | 7 | 8;
  stopBits: 1 | 2;
  parity: 'none' | 'even' | 'odd' | 'mark' | 'space';
}

// 串口连接状态类型
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

// 数据格式类型
export type DataFormat = 'text' | 'hex';
