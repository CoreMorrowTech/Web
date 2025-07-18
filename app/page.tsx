"use client"

import SerialPortDashboard from '@/components/SerialPortDashboard'
import Link from 'next/link'
import { useState, useEffect } from 'react'

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
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            串口通讯Web管理平台
          </h1>

          {isWebSerialSupported && (
            <Link 
              href="/web-serial" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              使用Web Serial API
            </Link>
          )}
        </div>
      </header>

      {isWebSerialSupported && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  您的浏览器支持Web Serial API！这意味着您可以<Link href="/web-serial" className="font-medium underline">直接通过浏览器访问串口设备</Link>，无需安装任何额外软件。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <SerialPortDashboard />
      </main>
    </div>
  )
}
