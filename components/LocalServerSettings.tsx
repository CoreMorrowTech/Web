"use client"

import React, { useState, useEffect } from 'react';
import SerialPortClientService from '@/services/serialPortClientService';

export const LocalServerSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    enabled: false,
    url: 'ws://localhost:8080'
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // 初始化时加载配置
  useEffect(() => {
    if (SerialPortClientService) {
      const savedConfig = SerialPortClientService.getLocalServerConfig();
      setConfig(savedConfig);
    }
  }, []);

  // 保存配置
  const saveConfig = () => {
    if (SerialPortClientService) {
      SerialPortClientService.setLocalServerConfig(config);
      setIsOpen(false);
      // 如果启用，强制刷新页面以重新连接
      if (config.enabled) {
        window.location.reload();
      }
    }
  };

  // 测试连接
  const testConnection = async () => {
    setTestStatus('testing');
    try {
      // 创建临时WebSocket连接测试
      const socket = new WebSocket(config.url);

      // 设置超时
      const timeoutId = setTimeout(() => {
        socket.close();
        setTestStatus('error');
      }, 5000);

      // 设置事件处理器
      socket.onopen = () => {
        clearTimeout(timeoutId);
        socket.close();
        setTestStatus('success');
      };

      socket.onerror = () => {
        clearTimeout(timeoutId);
        setTestStatus('error');
      };
    } catch (error) {
      console.error('测试连接失败:', error);
      setTestStatus('error');
    }
  };

  return (
    <div>
      {/* 设置按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 text-sm font-medium rounded-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
      >
        本地服务器设置
      </button>

      {/* 设置弹窗 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              本地串口服务器设置
            </h3>

            <div className="space-y-4">
              {/* 启用开关 */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  启用本地串口服务器
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={config.enabled}
                    onChange={(e) => setConfig({...config, enabled: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* 服务器URL */}
              <div>
                <label htmlFor="serverUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  服务器URL
                </label>
                <input
                  id="serverUrl"
                  type="text"
                  value={config.url}
                  onChange={(e) => setConfig({...config, url: e.target.value})}
                  placeholder="ws://localhost:8080"
                  className="block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  请确保已启动本地串口服务器（运行start-local-server.bat）
                </p>
              </div>

              {/* 测试连接 */}
              <div>
                <button
                  onClick={testConnection}
                  disabled={testStatus === 'testing'}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testStatus === 'testing' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      测试中...
                    </>
                  ) : '测试连接'}
                </button>

                {testStatus === 'success' && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    连接成功！本地串口服务器可用。
                  </p>
                )}

                {testStatus === 'error' && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    连接失败！请确保本地串口服务器已启动并检查URL是否正确。
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                取消
              </button>
              <button
                onClick={saveConfig}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
