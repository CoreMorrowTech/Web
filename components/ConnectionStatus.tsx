"use client"

import { useWebSocketStore } from '@/store/websocketStore';

export const ConnectionStatus = () => {
  const { isConnected } = useWebSocketStore();

  return (
    <div className="flex items-center">
      <div
        className={`w-3 h-3 rounded-full mr-2 ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {isConnected ? '服务已连接' : '服务未连接'}
      </span>
    </div>
  );
};
