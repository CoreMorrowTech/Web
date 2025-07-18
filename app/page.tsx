import SerialPortDashboard from '@/components/SerialPortDashboard'

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            串口通讯Web管理平台
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <SerialPortDashboard />
      </main>
    </div>
  )
}
