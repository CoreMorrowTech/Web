"use client"

import { useState } from 'react';
import { useSerialPortStore } from '@/store/serialPortStore';
import { DataFormat } from '@/types/serialPort';

interface DataTransmissionProps {
  isConnected: boolean;
}

export const DataTransmission = ({ isConnected }: DataTransmissionProps) => {
  const { sendData, receivedData, clearReceivedData } = useSerialPortStore();

  const [dataToSend, setDataToSend] = useState('');
  const [dataFormat, setDataFormat] = useState<DataFormat>('text');
  const [isSending, setIsSending] = useState(false);

  // 发送数据
  const handleSendData = async () => {
    if (!dataToSend.trim()) return;

    setIsSending(true);
    try {
      await sendData(dataToSend, dataFormat);
      // 发送成功后清空输入框
      setDataToSend('');
    } catch (error) {
      console.error('Failed to send data:', error);
    } finally {
      setIsSending(false);
    }
  };

  // 验证十六进制输入
  const validateHexInput = (input: string) => {
    // 允许空格作为分隔符，只接受有效的十六进制字符
    return /^[0-9A-Fa-f\s]*$/.test(input);
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    // 如果是十六进制模式，验证输入
    if (dataFormat === 'hex' && !validateHexInput(value)) {
      return; // 不是有效的十六进制输入，不更新状态
    }

    setDataToSend(value);
  };

  // 处理数据格式切换
  const handleFormatChange = (format: DataFormat) => {
    if (format === dataFormat) return;

    // 清空输入框，避免格式转换问题
    setDataToSend('');
    setDataFormat(format);
  };

  // 格式化接收的数据显示
  const formatReceivedData = () => {
    if (receivedData.length === 0) {
      return <div className="text-gray-500 dark:text-gray-400 text-center p-4">暂无数据</div>;
    }

    return receivedData.map((data, index) => (
      <div
        key={index}
        className="py-1 border-b border-gray-200 dark:border-gray-700 last:border-0 font-mono text-sm"
      >
        {data}
      </div>
    ));
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          数据传输
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => handleFormatChange('text')}
            className={`px-3 py-1 text-sm rounded-md ${
              dataFormat === 'text'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            文本
          </button>
          <button
            onClick={() => handleFormatChange('hex')}
            className={`px-3 py-1 text-sm rounded-md ${
              dataFormat === 'hex'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            十六进制
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* 发送区域 */}
        <div className="mb-4">
          <label htmlFor="sendData" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            发送数据
          </label>
          <div className="flex space-x-2">
            <textarea
              id="sendData"
              rows={3}
              value={dataToSend}
              onChange={handleInputChange}
              disabled={!isConnected}
              placeholder={dataFormat === 'hex'
                ? "输入十六进制数据，例如: 48 65 6C 6C 6F"
                : "输入要发送的文本数据"}
              className="block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendData}
              disabled={!isConnected || isSending || !dataToSend.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  发送中
                </>
              ) : '发送'}
            </button>
          </div>
          {dataFormat === 'hex' && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              请输入有效的十六进制数据，可用空格分隔
            </p>
          )}
        </div>

        {/* 接收区域 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              接收数据
            </label>
            <button
              onClick={clearReceivedData}
              className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              清空
            </button>
          </div>
          <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-y-auto h-64 bg-gray-50 dark:bg-gray-900">
            <div className="p-2 divide-y divide-gray-200 dark:divide-gray-700">
              {formatReceivedData()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
