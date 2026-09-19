@echo off
title 开物脉络 - 本地服务
cd /d "%~dp0kaiwu-mailuo\backend"

echo ============================================
echo   开物脉络 · 本地服务启动中
echo ============================================
echo   学生端  http://localhost:8100
echo   教师端  http://localhost:8100/#/teacher
echo.
echo   关闭本窗口即停止服务。
echo   若提示端口被占用，请先关闭旧的服务窗口。
echo.
rem 延迟 3 秒等服务就绪，再打开浏览器
start "" /min cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:8100"

python -m uvicorn main:app --host 127.0.0.1 --port 8100
echo.
echo 服务已退出。若前端改过代码，请先在 frontend 目录执行 npm run build 再重新启动。
pause
