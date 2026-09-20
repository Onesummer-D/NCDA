#!/usr/bin/env bash
# 开物四百年 · 云服务器一键初始化
# 前提：代码包已解压到 /opt/kaiwu（含 backend/ frontend/dist deploy/）
# 用法：sudo bash /opt/kaiwu/deploy/server_setup.sh
set -e
cd /opt/kaiwu

echo "==> 安装系统依赖"
apt-get update -y
apt-get install -y python3-venv python3-pip

echo "==> 创建 Python 虚拟环境并安装依赖（清华镜像加速）"
python3 -m venv venv
./venv/bin/pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple
./venv/bin/pip install -r backend/requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

echo "==> 注册 systemd 服务（开机自启 + 崩溃自动重启）"
cp deploy/kaiwu.service /etc/systemd/system/kaiwu.service
systemctl daemon-reload
systemctl enable --now kaiwu

sleep 2
echo "==> 服务状态"
systemctl --no-pager --lines=5 status kaiwu || true
echo ""
echo "部署完成。浏览器访问 http://<服务器公网IP>:8100 验证。"
echo "如需 AI 问答：编辑 /etc/systemd/system/kaiwu.service 填入 DEEPSEEK_API_KEY，再执行 systemctl restart kaiwu"
