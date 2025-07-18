// 客户端到服务端消息类型
export type ClientMessageType = 'LIST_PORTS' | 'CONNECT_PORT' | 'DISCONNECT_PORT' | 'SEND_DATA';

// 服务端到客户端消息类型
export type ServerMessageType = 'PORT_LIST' | 'PORT_CONNECTED' | 'PORT_DISCONNECTED' | 'DATA_RECEIVED' | 'ERROR';

// 客户端到服务端消息接口
export interface ClientMessage {
  type: ClientMessageType;
  payload: any;
}

// 服务端到客户端消息接口
export interface ServerMessage {
  type: ServerMessageType;
  payload: any;
}

// 错误类型枚举
export enum ErrorType {
  WEBSOCKET_CONNECTION_FAILED = 'WEBSOCKET_CONNECTION_FAILED',
  SERIAL_PORT_ACCESS_DENIED = 'SERIAL_PORT_ACCESS_DENIED',
  SERIAL_PORT_NOT_FOUND = 'SERIAL_PORT_NOT_FOUND',
  SERIAL_PORT_ALREADY_OPEN = 'SERIAL_PORT_ALREADY_OPEN',
  DATA_FORMAT_INVALID = 'DATA_FORMAT_INVALID'
}
