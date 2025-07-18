import { useState, useEffect } from 'react'
import { SerialPortList } from './components/SerialPortList'
import { SerialPortManager } from './components/SerialPortManager'
import { ConnectionStatus } from './components/ConnectionStatus'
import { useWebSocketStore } from './store/websocketStore'
import { useSerialPortStore } from './store/serialPortStore'
import { SerialPort } from './types/serialPort'

function App() {
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
    connect('ws://localhost:8080/ws')
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            串口通讯Web管理平台
          </h1>
          <ConnectionStatus />
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
      </main>
    </div>
  )
}

export default App
