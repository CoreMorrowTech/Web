"use client"

import { useState, useEffect } from 'react'
import { SerialPortList } from './SerialPortList'
import { SerialPortManager } from './SerialPortManager'
import { ConnectionStatus } from './ConnectionStatus'
import { LocalServerSettings } from './LocalServerSettings'
import { useWebSocketStore } from '@/store/websocketStore'
import { useSerialPortStore } from '@/store/serialPortStore'
import { SerialPort } from '@/types/serialPort'

export default function SerialPortDashboard() {
  const { connect, isConnected } = useWebSocketStore()
  const {
    ports,
    selectedPort,
    setSelectedPort,
    fetchPorts
  } = useSerialPortStore()

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isVercelEnv, setIsVercelEnv] = useState<boolean>(false)

  // 检测是否在Vercel环境中
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isVercel = window.location.hostname.endsWith('vercel.app') || 
                      window.location.hostname.includes('vercel') ||
                      window.location.hostname !== 'localhost';
      setIsVercelEnv(isVercel);
    }
  }, []);

  // 连接WebSocket
  useEffect(() => {
    // 使用相对路径，让Next.js正确处理
    connect('/api/ws')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 当WebSocket连接成功后获取串口列表
  useEffect(() => {
    if (isConnected) {
      setIsLoading(true)
      fetchPorts()
        .finally(() => setIsLoading(false))
    }
  }, [isConnected, fetchPorts])

  const handlePortSelect = (port: SerialPort) => {
    setSelectedPort(port)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        {isVercelEnv && (
          <div className="flex items-center">
            <LocalServerSettings />
          </div>
        )}
        <ConnectionStatus />
      </div>

      {isVercelEnv && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 mb-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                您正在使用Vercel部署的应用程序。要访问本地串口设备，请先运行本地串口服务器（<code>start-local-server.bat</code>），然后点击"本地服务器设置"按钮配置连接。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <SerialPortList
            ports={ports}
            selectedPort={selectedPort}
            onPortSelect={handlePortSelect}
            isLoading={isLoading}
            onRefresh={() => fetchPorts()}
          />
        </div>
        <div className="lg:col-span-8">
          {selectedPort ? (
            <SerialPortManager selectedPort={selectedPort} />
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                请从左侧列表选择一个串口设备
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
