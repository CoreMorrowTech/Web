import { useState } from 'react';
import { SerialPort, ConnectionOptions, ConnectionStatus } from '../types/serialPort';
import { useSerialPortStore } from '../store/serialPortStore';

interface ConnectionPanelProps {
  selectedPort: SerialPort;
  connectionStatus: ConnectionStatus;
}

// 波特率选项
const baudRateOptions = [
  110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 
  57600, 115200, 128000, 256000, 500000, 921600, 1000000
];

// 数据位选项
const dataBitsOptions = [5, 6, 7, 8] as const;

// 停止位选项
const stopBitsOptions = [1, 2] as const;

// 校验位选项
const parityOptions = [
  { value: 'none', label: '无' },
  { value: 'even', label: '偶校验' },
  { value: 'odd', label: '奇校验' },
  { value: 'mark', label: '标记' },
  { value: 'space', label: '空格' }
] as const;

export const ConnectionPanel = ({ 
  selectedPort, 
  connectionStatus 
}: ConnectionPanelProps) => {
  const { 
    connectionOptions, 
    setConnectionOptions, 
    connectPort, 
    disconnectPort 
  } = useSerialPortStore();

  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectPort();
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectPort();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const isDisconnected = connectionStatus === 'disconnected';
  const isConnected = connectionStatus === 'connected';

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          连接设置
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          端口: {selectedPort.path}
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* 连接状态指示器 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            连接状态
          </span>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              isConnected ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 
              'bg-red-500'
            }`}/>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? '已连接' : 
               connectionStatus === 'connecting' ? '连接中...' : 
               '未连接'}
            </span>
          </div>
        </div>

        {/* 波特率选择 */}
        <div>
          <label htmlFor="baudRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            波特率
          </label>
          <select
            id="baudRate"
            value={connectionOptions.baudRate}
            onChange={(e) => setConnectionOptions({ baudRate: Number(e.target.value) })}
            disabled={!isDisconnected}
            className="block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {baudRateOptions.map((rate) => (
              <option key={rate} value={rate}>
                {rate}
              </option>
            ))}
          </select>
        </div>

        {/* 数据位选择 */}
        <div>
          <label htmlFor="dataBits" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            数据位
          </label>
          <select
            id="dataBits"
            value={connectionOptions.dataBits}
            onChange={(e) => setConnectionOptions({ dataBits: Number(e.target.value) as 5 | 6 | 7 | 8 })}
            disabled={!isDisconnected}
            className="block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dataBitsOptions.map((bits) => (
              <option key={bits} value={bits}>
                {bits}
              </option>
            ))}
          </select>
        </div>

        {/* 停止位选择 */}
        <div>
          <label htmlFor="stopBits" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            停止位
          </label>
          <select
            id="stopBits"
            value={connectionOptions.stopBits}
            onChange={(e) => setConnectionOptions({ stopBits: Number(e.target.value) as 1 | 2 })}
            disabled={!isDisconnected}
            className="block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {stopBitsOptions.map((bits) => (
              <option key={bits} value={bits}>
                {bits}
              </option>
            ))}
          </select>
        </div>

        {/* 校验位选择 */}
        <div>
          <label htmlFor="parity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            校验位
          </label>
          <select
            id="parity"
            value={connectionOptions.parity}
            onChange={(e) => setConnectionOptions({ 
              parity: e.target.value as 'none' | 'even' | 'odd' | 'mark' | 'space' 
            })}
            disabled={!isDisconnected}
            className="block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {parityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 连接/断开按钮 */}
        <div className="pt-2">
          {isDisconnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  连接中...
                </>
              ) : '连接'}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              断开连接
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
