import { NextResponse } from 'next/server';

// 模拟的串口设备数据
const mockPorts = [
  {
    path: 'COM1',
    manufacturer: '模拟设备',
    serialNumber: 'SIM001',
    vendorId: '0000',
    productId: '0001'
  },
  {
    path: 'COM2',
    manufacturer: 'Arduino',
    serialNumber: 'SIM002',
    vendorId: '2341',
    productId: '0043'
  },
  {
    path: 'COM3',
    manufacturer: '其他设备',
    serialNumber: 'SIM003',
    vendorId: '1A86',
    productId: '7523'
  }
];

// 创建REST API作为WebSocket的替代
export async function GET() {
  return NextResponse.json({
    type: 'PORT_LIST',
    payload: { 
      ports: mockPorts,
      message: '这是一个模拟的串口列表，实际串口操作需要在本地环境中运行'
    }
  });
}

// 处理串口连接请求
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, payload } = body;

    switch (type) {
      case 'LIST_PORTS':
        return NextResponse.json({
          type: 'PORT_LIST',
          payload: { ports: mockPorts }
        });

      case 'CONNECT_PORT':
        return NextResponse.json({
          type: 'PORT_CONNECTED',
          payload: { 
            path: payload.path,
            message: '这是一个模拟的连接响应，实际串口连接需要在本地环境中运行'
          }
        });

      case 'DISCONNECT_PORT':
        return NextResponse.json({
          type: 'PORT_DISCONNECTED',
          payload: { 
            path: payload.path,
            message: '这是一个模拟的断开连接响应'
          }
        });

      case 'SEND_DATA':
        return NextResponse.json({
          type: 'DATA_RECEIVED',
          payload: { 
            path: payload.path,
            data: `模拟响应: ${payload.data}`,
            message: '这是一个模拟的数据发送响应'
          }
        });

      default:
        return NextResponse.json(
          { error: '未知命令类型' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: '请求处理失败' },
      { status: 500 }
    );
  }
}
