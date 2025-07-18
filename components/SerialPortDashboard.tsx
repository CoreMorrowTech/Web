"use client"

import { useState, useEffect } from 'react'
import { SerialPortList } from './SerialPortList'
import { SerialPortManager } from './SerialPortManager'
import { ConnectionStatus } from './ConnectionStatus'
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
      <div className="flex justify-end items-center mb-4">
        <ConnectionStatus />
      </div>

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
