# 串口通讯Web管理平台 (Next.js版)

## 项目介绍

串口通讯Web管理平台是一个企业级的Web应用程序，允许用户通过浏览器访问和管理本地的串口设备。该项目已重构为使用Next.js的前后端一体化架构，便于使用Vercel部署和维护。

## 功能特性

- 串口设备自动发现和列表展示
- 串口连接管理（连接、断开）
- 串口通讯功能（发送和接收数据）
- 支持文本和十六进制数据格式
- 实时通讯和状态更新
- 响应式设计，支持不同屏幕尺寸

## 技术栈

- **框架**: Next.js 14 (React 18 + Node.js)
- **UI**: Tailwind CSS
- **状态管理**: Zustand
- **WebSocket**: ws
- **串口通讯**: serialport
- **部署平台**: Vercel

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 启动生产服务

```bash
npm start
```

## 项目结构

```
/
├── app/                  # Next.js App Router
│   ├── api/              # API路由
│   │   ├── hello/        # Hello API
│   │   └── ws/           # WebSocket API
│   ├── globals.css       # 全局样式
│   ├── layout.tsx        # 布局组件
│   └── page.tsx          # 首页
├── components/           # React组件
├── services/             # 服务
├── store/                # Zustand状态管理
├── types/                # TypeScript类型定义
├── next.config.js        # Next.js配置
├── package.json          # 项目依赖
├── tailwind.config.js    # Tailwind配置
├── tsconfig.json         # TypeScript配置
└── vercel.json           # Vercel部署配置
```

## Vercel部署

该项目已配置好用于Vercel部署。只需将代码推送到GitHub，然后在Vercel中导入该仓库即可完成部署。

## 注意事项

- 串口功能需要在本地环境中运行，因为Web浏览器无法直接访问硬件串口
- 部署到Vercel后，WebSocket API会在Edge函数中运行，但实际串口操作需要在本地服务中进行

## 许可证

[MIT](LICENSE)

