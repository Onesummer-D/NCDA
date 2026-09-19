@echo off
chcp 65001 >nul
title 开物脉络 - 本地服务
cd /d "%~dp0kaiwu-mailuo\backend"

echo 正在启动「开物脉络」本地服务...
echo 启动后请用浏览器打开:
echo   学生端  http://localhost:8100
echo   教师端  http://localhost:8100/#/teacher
echo.
echo 关闭本窗口即停止服务。如果前端改过代码，请先在 frontend 目录执行 npm run build。
echo.

start "" http://localhost:8100
python -m uvicorn main:app --host 127.0.0.1 --port 8100
pause
