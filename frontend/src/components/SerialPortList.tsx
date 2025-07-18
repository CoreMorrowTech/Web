import { SerialPort } from '../types/serialPort';

interface SerialPortListProps {
  ports: SerialPort[];
  selectedPort: SerialPort | null;
  onPortSelect: (port: SerialPort) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const SerialPortList = ({
  ports,
  selectedPort,
  onPortSelect,
  isLoading,
  onRefresh
}: SerialPortListProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          串口设备列表
        </h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-700 dark:text-indigo-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              加载中...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新
            </>
          )}
        </button>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            正在加载串口设备...
          </div>
        ) : ports.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            未发现串口设备
          </div>
        ) : (
          ports.map((port) => (
            <div
              key={port.path}
              className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                selectedPort?.path === port.path ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
              }`}
              onClick={() => onPortSelect(port)}
            >
              <div className="flex justify-between">
                <div className="font-medium text-gray-900 dark:text-white">
                  {port.path}
                </div>
                {selectedPort?.path === port.path && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    已选择
                  </span>
                )}
              </div>
              {port.manufacturer && (
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  制造商: {port.manufacturer}
                </div>
              )}
              {port.serialNumber && (
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  序列号: {port.serialNumber}
                </div>
              )}
              {(port.vendorId || port.productId) && (
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {port.vendorId && `厂商ID: ${port.vendorId}`}
                  {port.vendorId && port.productId && ' | '}
                  {port.productId && `产品ID: ${port.productId}`}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
