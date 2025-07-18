"use client"

import React, { useState, useEffect } from 'react';
import { useSerialPortStore } from '@/store/serialPortStore';
import { SerialPort } from '@/types/serialPort';

export const WebSerialController: React.FC = () => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [port, setPort] = useState<any>(null);
  const [reader, setReader] = useState<any>(null);
  const [isReading, setIsReading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [info, setInfo] = useState<string>('');

  const { 
    setSelectedPort, 
    connectionOptions, 
    connectionStatus,
    receivedData,
    clearReceivedData
  } = useSerialPortStore();

  // 检查浏览器是否支持Web Serial API
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsSupported('serial' in navigator);
    }
  }, []);

  // 清理资源
  useEffect(() => {
    return () => {
      if (reader) {
        setIsReading(false);
        reader.cancel().catch(console.error);
      }
    };
  }, [reader]);

  // 获取已连接的串口
  const getPorts = async () => {
    try {
      if (!navigator.serial) {
        throw new Error('浏览器不支持Web Serial API');
      }

      const ports = await navigator.serial.getPorts();
      setInfo(`发现${ports.length}个已连接的串口设备`);

      // 如果有连接的端口，自动选择第一个
      if (ports.length > 0) {
        setPort(ports[0]);

        // 创建一个模拟的SerialPort对象用于store
        const mockPort: SerialPort = {
          path: '通过Web Serial API连接',
          manufacturer: '浏览器直接访问',
          serialNumber: '',
          vendorId: '',
          productId: ''
        };

        setSelectedPort(mockPort);
      }
    } catch (err: any) {
      setError(err.message || '获取串口列表失败');
    }
  };

  // 请求用户选择串口
  const requestPort = async () => {
    try {
      if (!navigator.serial) {
        throw new Error('浏览器不支持Web Serial API');
      }

      setError('');
      setInfo('请在弹出窗口中选择串口设备...');

      const selectedPort = await navigator.serial.requestPort();
      setPort(selectedPort);
      setInfo('串口设备已选择，请点击"连接串口"按钮');

      // 创建一个模拟的SerialPort对象用于store
      const mockPort: SerialPort = {
        path: '通过Web Serial API连接',
        manufacturer: '浏览器直接访问',
        serialNumber: '',
        vendorId: '',
        productId: ''
      };

      setSelectedPort(mockPort);
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        setError('没有找到可用的串口设备');
      } else if (err.name === 'SecurityError') {
        setError('无权限访问串口设备');
      } else {
        setError(err.message || '选择串口失败');
      }
    }
  };

  // 连接到串口
  const connectToPort = async () => {
    if (!port) {
      setError('请先选择串口设备');
      return;
    }

    try {
      setError('');
      setInfo('正在连接串口...');

      // 使用store中的连接选项
      await port.open({
        baudRate: connectionOptions.baudRate,
        dataBits: connectionOptions.dataBits,
        stopBits: connectionOptions.stopBits,
        parity: connectionOptions.parity
      });

      setInfo('串口已连接，开始读取数据');
      startReading();
    } catch (err: any) {
      setError(err.message || '连接串口失败');
    }
  };

  // 断开串口连接
  const disconnectPort = async () => {
    if (!port) return;

    try {
      setIsReading(false);
      if (reader) {
        await reader.cancel();
      }

      if (port.readable) {
        await port.readable.getReader().releaseLock();
      }

      await port.close();
      setInfo('串口已断开连接');
    } catch (err: any) {
      setError(err.message || '断开串口连接失败');
    }
  };

  // 开始读取串口数据
  const startReading = async () => {
    if (!port || !port.readable) return;

    try {
      setIsReading(true);

      // 循环读取数据
      while (port.readable && isReading) {
        const newReader = port.readable.getReader();
        setReader(newReader);

        try {
          while (true) {
            const { value, done } = await newReader.read();
            if (done) {
              break;
            }

            // 处理接收到的数据
            if (value) {
              const decoder = new TextDecoder();
              const text = decoder.decode(value);

              // 使用store的状态更新
              // 注意：这里我们无法直接调用store的方法来添加数据
              // 因为store的接收数据逻辑需要修改
              console.log('收到数据:', text);

              // 临时显示在info中
              setInfo(prevInfo => `${prevInfo}\n收到数据: ${text}`);
            }
          }
        } catch (err) {
          console.error('读取数据错误:', err);
        } finally {
          newReader.releaseLock();
        }
      }
    } catch (err: any) {
      setError(err.message || '读取串口数据失败');
      setIsReading(false);
    }
  };

  // 发送数据到串口
  const sendData = async (data: string, format: 'text' | 'hex') => {
    if (!port || !port.writable) {
      setError('串口未连接或不可写');
      return;
    }

    try {
      const writer = port.writable.getWriter();

      let buffer;
      if (format === 'hex') {
        // 处理十六进制数据
        const hexString = data.replace(/\s+/g, ''); // 移除所有空格
        if (!/^[0-9A-Fa-f]*$/.test(hexString)) {
          throw new Error('无效的十六进制格式');
        }

        // 将十六进制字符串转换为Uint8Array
        const bytes = [];
        for (let i = 0; i < hexString.length; i += 2) {
          bytes.push(parseInt(hexString.substr(i, 2), 16));
        }
        buffer = new Uint8Array(bytes);
      } else {
        // 文本数据
        const encoder = new TextEncoder();
        buffer = encoder.encode(data);
      }

      await writer.write(buffer);
      writer.releaseLock();

      setInfo(`已发送数据: ${data}`);
    } catch (err: any) {
      setError(err.message || '发送数据失败');
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Web Serial API 控制器</h2>

      {!isSupported ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-yellow-700 dark:text-yellow-300">
            您的浏览器不支持Web Serial API。请使用Chrome、Edge或其他基于Chromium的浏览器。
          </p>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4 mb-4">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {info && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 p-4 mb-4">
              <pre className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap">{info}</pre>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={getPorts}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              获取已连接设备
            </button>

            <button
              onClick={requestPort}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              选择串口设备
            </button>

            {port && !port.readable && (
              <button
                onClick={connectToPort}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                连接串口
              </button>
            )}

            {port && port.readable && (
              <button
                onClick={disconnectPort}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                断开连接
              </button>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">手动发送数据</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                id="sendData"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="输入要发送的数据"
              />
              <select
                id="dataFormat"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="text">文本</option>
                <option value="hex">十六进制</option>
              </select>
              <button
                onClick={() => {
                  const input = document.getElementById('sendData') as HTMLInputElement;
                  const select = document.getElementById('dataFormat') as HTMLSelectElement;
                  if (input && select) {
                    sendData(input.value, select.value as 'text' | 'hex');
                  }
                }}
                disabled={!port || !port.writable}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                发送
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
