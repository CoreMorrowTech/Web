@echo off
echo 正在启动串口通讯Web管理平台...

:: 设置控制台标题
title 串口通讯Web管理平台

:: 检查前端构建目录是否存在
if not exist "frontend\dist" (
  echo 前端未构建，正在构建...
  cd frontend
  call npm install
  call npm run build
  cd ..
)

:: 检查后端是否已构建
if not exist "backend\dist" (
  echo 后端未构建，正在构建...
  cd backend
  call npm install
  call npm run build
  cd ..
)

:: 设置生产环境变量
set NODE_ENV=production
set PORT=8080

:: 启动后端服务
echo 正在启动服务...
cd backend
node dist/index.js

pause
