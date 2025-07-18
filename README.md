# 串口通讯Web管理平台

## 项目介绍

串口通讯Web管理平台是一个企业级的Web应用程序，允许不同电脑上的用户通过浏览器访问和管理各自本地的串口设备。系统采用前端React + 后端TypeScript的架构，支持多用户同时访问，每个用户只能查看和操作自己电脑上的串口设备。

## 功能特性

- 串口设备自动发现和列表展示
- 串口连接管理（连接、断开）
- 串口通讯功能（发送和接收数据）
- 支持文本和十六进制数据格式
- 多用户隔离，确保安全性
- 实时通讯和状态更新
- 响应式设计，支持不同屏幕尺寸

## 技术栈

### 前端
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand（状态管理）

### 后端
- Node.js
- TypeScript
- ws（WebSocket库）
- serialport（Node.js串口通讯库）
- express（Web服务框架）

## 快速开始

### 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 启动开发服务器

```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务（在另一个终端）
cd frontend
npm run dev
```

### 构建生产版本

```bash
# 构建前端
cd frontend
npm run build

# 构建后端
cd backend
npm run build
```

## 项目结构

```
serial-port-web-manager/
├── frontend/            # React前端应用
│   ├── src/             # 源代码
│   │   ├── components/  # UI组件
│   │   ├── hooks/       # React Hooks
│   │   ├── services/    # 服务层
│   │   ├── store/       # 状态管理
│   │   └── types/       # TypeScript类型定义
│   ├── public/          # 静态资源
│   └── index.html       # HTML入口文件
│
├── backend/             # Node.js后端服务
│   ├── src/             # 源代码
│   │   ├── services/    # 服务层
│   │   ├── websocket/   # WebSocket处理
│   │   └── types/       # TypeScript类型定义
│   └── dist/            # 编译输出目录
│
└── README.md            # 项目说明文档
```

## 许可证

[MIT](LICENSE)
