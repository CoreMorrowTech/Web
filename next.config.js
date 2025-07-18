/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 确保服务器组件可以使用SerialPort库
  serverComponentsExternalPackages: ['serialport'],
}

module.exports = nextConfig
