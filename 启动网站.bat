@echo off
title 开物脉络 - 本地服务
cd /d "%~dp0kaiwusibainian\backend"

rem 取本机局域网 IPv4 地址（供手机访问）
set LAN_IP=
for /f "tokens=2 delims=:" %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -First 1).IPAddress"') do set LAN_IP=%%a

echo ============================================
echo   开物脉络 · 本地服务启动中
echo ============================================
echo   电脑端  http://localhost:8100
echo   教师端  http://localhost:8100/#/teacher
if not "%LAN_IP%"=="" (
  echo   手机端  http://%LAN_IP%:8100   （同一 Wi-Fi 下用手机浏览器打开）
)
echo.
echo   关闭本窗口即停止服务。
echo   若提示端口被占用，请先关闭旧的服务窗口。
echo   若手机打不开，请在 Windows 防火墙中放行 Python 或 8100 端口。
echo.
rem 延迟 3 秒等服务就绪，再打开浏览器
start "" /min cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:8100"

python -m uvicorn main:app --host 0.0.0.0 --port 8100
echo.
echo 服务已退出。若前端改过代码，请先在 frontend 目录执行 npm run build 再重新启动。
pause
