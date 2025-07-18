import './globals.css'

export const metadata = {
  title: '串口通讯Web管理平台',
  description: '一个用于管理和监控串口通讯的Web应用程序',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
