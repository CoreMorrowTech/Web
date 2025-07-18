"use client"

import { WebSerialController } from '@/components/WebSerialController'
import { useEffect, useState } from 'react'

export default function Home() {
  const [isWebSerialSupported, setIsWebSerialSupported] = useState(false);

  useEffect(() => {
    // 检查浏览器是否支持Web Serial API
    if (typeof navigator !== 'undefined') {
      setIsWebSerialSupported('serial' in navigator);
    }
  }, []);

  return (
    <div className="min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            串口通讯Web控制平台
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {!isWebSerialSupported ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  您的浏览器不支持Web Serial API。请使用Chrome、Edge或其他基于Chromium的浏览器。
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900/30 border-l-4 border-blue-400 p-4 mb-6">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Web Serial API</strong> 允许浏览器直接访问本地串口设备，无需安装任何插件或软件。
              目前此功能仅支持 Chrome、Edge 和其他基于 Chromium 的浏览器。
            </p>
          </div>
        )}

        <WebSerialController />
      </main>
    </div>
  )
}
