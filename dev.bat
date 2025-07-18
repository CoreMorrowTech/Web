@echo off
echo 正在启动串口通讯Web管理平台（开发模式）...

:: 设置控制台标题
title 串口通讯Web管理平台 - 开发模式

:: 打开新的命令行窗口启动后端
start cmd /k "cd backend && npm install && npm run dev"

:: 等待2秒后启动前端，确保后端已经启动
timeout /t 2 /nobreak > nul

:: 打开新的命令行窗口启动前端
start cmd /k "cd frontend && npm install && npm run dev"

echo 开发服务器已启动：
echo - 前端: http://localhost:3000
echo - 后端: http://localhost:8080
echo - WebSocket: ws://localhost:8080/ws
