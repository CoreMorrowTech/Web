"use client"

import { WebSerialController } from '@/components/WebSerialController';
import Link from 'next/link';

export default function WebSerialPage() {
  return (
    <div className="min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Web Serial API 串口控制
          </h1>
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            返回首页
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-gray-50 dark:bg-gray-900/30 border-l-4 border-blue-400 p-4 mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Web Serial API</strong> 允许浏览器直接访问本地串口设备，无需安装任何插件或软件。
            目前此功能仅支持 Chrome、Edge 和其他基于 Chromium 的浏览器。
          </p>
        </div>

        <WebSerialController />
      </main>
    </div>
  );
}
