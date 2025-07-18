# 设计文档

## 概述

串口通讯Web管理平台采用混合架构设计，结合了Web技术和本地服务的优势。系统由三个主要组件构成：React前端应用、本地TypeScript服务和WebSocket通讯层。每台电脑运行独立的本地服务来处理串口操作，前端通过WebSocket与本地服务实时通讯，实现了跨平台的串口管理功能。

## 架构

### 整体架构图

```
┌─────────────────┐    WebSocket    ┌──────────────────┐    Serial API    ┌─────────────┐
│   React 前端    │ ←──────────────→ │  本地 TS 服务    │ ←───────────────→ │   串口设备   │
│   (浏览器)      │                 │  (Node.js)      │                  │            │
└─────────────────┘                 └──────────────────┘                  └─────────────┘
```

### 架构特点

1. **分离式架构**：前端Web应用与本地串口服务分离，提高了系统的灵活性
2. **实时通讯**：使用WebSocket实现前后端实时数据传输
3. **本地隔离**：每台电脑运行独立服务，天然实现用户隔离
4. **无状态设计**：服务不依赖数据库，所有状态在内存中管理

## 组件和接口

### 前端组件 (React + TypeScript)

#### 1. 应用主组件 (App)
- **职责**：应用程序入口，管理全局状态和路由
- **状态**：WebSocket连接状态、当前选中串口
- **子组件**：SerialPortList, SerialPortManager, ConnectionStatus

#### 2. 串口列表组件 (SerialPortList)
- **职责**：显示可用串口设备列表
- **属性**：ports (串口列表), onPortSelect (选择回调)
- **状态**：loading, error

#### 3. 串口管理组件 (SerialPortManager)
- **职责**：管理选中串口的连接和通讯
- **属性**：selectedPort, connectionStatus
- **子组件**：ConnectionPanel, DataTransmission

#### 4. 连接面板组件 (ConnectionPanel)
- **职责**：串口连接参数配置和连接控制
- **状态**：baudRate, dataBits, stopBits, parity
- **方法**：connect(), disconnect()

#### 5. 数据传输组件 (DataTransmission)
- **职责**：数据发送和接收界面
- **状态**：sendData, receivedData, dataFormat
- **方法**：sendData(), clearReceived()

### 后端服务 (Node.js + TypeScript)

#### 1. 串口服务 (SerialPortService)
- **职责**：管理串口设备的发现、连接和通讯
- **方法**：
  - `listPorts()`: 获取可用串口列表
  - `connectPort(path, options)`: 连接指定串口
  - `disconnectPort(path)`: 断开串口连接
  - `sendData(path, data)`: 发送数据到串口
  - `onDataReceived(callback)`: 注册数据接收回调

#### 2. WebSocket服务 (WebSocketService)
- **职责**：处理前后端WebSocket通讯
- **方法**：
  - `handleConnection(socket)`: 处理新连接
  - `broadcastPortList()`: 广播串口列表更新
  - `broadcastDataReceived(port, data)`: 广播接收到的数据

#### 3. 应用服务 (AppService)
- **职责**：应用程序主服务，协调各个组件
- **方法**：
  - `start()`: 启动服务
  - `stop()`: 停止服务
  - `handlePortListRequest()`: 处理串口列表请求

### 接口定义

#### WebSocket 消息接口

```typescript
// 客户端到服务端消息
interface ClientMessage {
  type: 'LIST_PORTS' | 'CONNECT_PORT' | 'DISCONNECT_PORT' | 'SEND_DATA';
  payload: any;
}

// 服务端到客户端消息
interface ServerMessage {
  type: 'PORT_LIST' | 'PORT_CONNECTED' | 'PORT_DISCONNECTED' | 'DATA_RECEIVED' | 'ERROR';
  payload: any;
}
```

#### 串口数据接口

```typescript
interface SerialPort {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  productId?: string;
  vendorId?: string;
}

interface ConnectionOptions {
  baudRate: number;
  dataBits: 5 | 6 | 7 | 8;
  stopBits: 1 | 2;
  parity: 'none' | 'even' | 'odd' | 'mark' | 'space';
}
```

## 数据模型

### 前端状态模型 (MVVM)

#### ViewModel 层
```typescript
class SerialPortViewModel {
  // 状态
  ports: SerialPort[] = [];
  selectedPort: SerialPort | null = null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  receivedData: string[] = [];
  
  // 方法
  async loadPorts(): Promise<void>;
  async connectPort(port: SerialPort, options: ConnectionOptions): Promise<void>;
  async disconnectPort(): Promise<void>;
  async sendData(data: string): Promise<void>;
}
```

#### Model 层
```typescript
class SerialPortModel {
  private websocket: WebSocket;
  
  // WebSocket 通讯方法
  sendMessage(message: ClientMessage): void;
  onMessage(callback: (message: ServerMessage) => void): void;
}
```

### 后端数据模型

```typescript
class PortManager {
  private connectedPorts: Map<string, SerialPort> = new Map();
  private portListeners: Map<string, (data: Buffer) => void> = new Map();
  
  async getAvailablePorts(): Promise<SerialPort[]>;
  async connectPort(path: string, options: ConnectionOptions): Promise<void>;
  async disconnectPort(path: string): Promise<void>;
  async writeToPort(path: string, data: Buffer): Promise<void>;
}
```

## 错误处理

### 前端错误处理
1. **WebSocket连接错误**：显示连接状态，提供重连机制
2. **串口操作错误**：显示具体错误信息，提供重试选项
3. **数据格式错误**：输入验证和格式转换错误提示

### 后端错误处理
1. **串口访问错误**：捕获串口打开、读写错误，返回详细错误信息
2. **WebSocket错误**：处理连接断开、消息格式错误
3. **系统资源错误**：处理端口占用、权限不足等系统级错误

### 错误类型定义
```typescript
enum ErrorType {
  WEBSOCKET_CONNECTION_FAILED = 'WEBSOCKET_CONNECTION_FAILED',
  SERIAL_PORT_ACCESS_DENIED = 'SERIAL_PORT_ACCESS_DENIED',
  SERIAL_PORT_NOT_FOUND = 'SERIAL_PORT_NOT_FOUND',
  SERIAL_PORT_ALREADY_OPEN = 'SERIAL_PORT_ALREADY_OPEN',
  DATA_FORMAT_INVALID = 'DATA_FORMAT_INVALID'
}
```

## 测试策略

### 前端测试
1. **组件测试**：使用React Testing Library测试各个组件的渲染和交互
2. **状态管理测试**：测试ViewModel的状态变化和方法调用
3. **WebSocket通讯测试**：模拟WebSocket消息的发送和接收

### 后端测试
1. **串口服务测试**：使用虚拟串口测试串口操作功能
2. **WebSocket服务测试**：测试WebSocket连接和消息处理
3. **集成测试**：测试前后端完整的通讯流程

### 测试工具
- **前端**：Jest, React Testing Library, WebSocket Mock
- **后端**：Jest, Supertest, 虚拟串口工具

## 技术选型

### 前端技术栈
- **React 18**：现代React框架，支持并发特性
- **TypeScript**：类型安全的JavaScript超集
- **Vite**：快速的构建工具
- **Tailwind CSS**：实用优先的CSS框架
- **Zustand**：轻量级状态管理库

### 后端技术栈
- **Node.js**：JavaScript运行时
- **TypeScript**：类型安全开发
- **ws**：WebSocket库
- **serialport**：Node.js串口通讯库
- **express**：Web服务框架（用于静态文件服务）

### 部署方案
1. **开发模式**：前端开发服务器 + 后端开发服务器
2. **生产模式**：后端服务器同时提供静态文件服务和WebSocket服务
3. **打包方案**：使用electron-builder打包成桌面应用（可选）