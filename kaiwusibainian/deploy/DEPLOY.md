# 开物四百年 · 云服务器部署指南（方案一）

目标：把系统部署到一台国内云服务器，得到 `http://<公网IP>:8100` 的公网地址，
印在展板/海报上的二维码扫码即可体验。

> 本项目部署条件很好：`uvicorn` 单进程同时服务 API 和 `frontend/dist` 静态页，
> 数据库是 SQLite（启动时 `seed.init_db()` 自动建库灌数据），服务器只需要 Python。

---

## 第 0 步 · 买服务器（约 10 分钟）

1. 平台：腾讯云「轻量应用服务器」或阿里云「轻量应用服务器」（新用户/学生优惠，一般几十到一百多一年）
2. 配置：**2核2G 最低配即可**（系统占用极低）；地域选离你近的（如华南-广州）
3. 镜像：**Ubuntu 24.04 LTS**（22.04 也可以）
4. 买完在控制台记下两样东西：
   - **公网 IP**
   - **登录密码**（或自己重置一次密码）。腾讯轻量默认用户名可能是 `ubuntu` 或 `lighthouse`，阿里云一般是 `root`

## 第 1 步 · 防火墙放行 8100 端口（控制台操作）

轻量服务器控制台 → 「防火墙」→ 添加规则 → 放行 **TCP 8100**。
不放行的话外网扫码是打不开的，这步最容易漏。

## 第 2 步 · 本地打包并上传（在 Git Bash 里执行）

先确认前端是最新构建：

```bash
cd /d/Onesummer_D/Learning/Competitons/NCDA/kaiwusibainian/frontend
npm run build
```

打包（自动排除数据库/密钥/缓存，**不会把 local_settings.py 和 app.db 传上去**）：

```bash
cd /d/Onesummer_D/Learning/Competitons/NCDA/kaiwusibainian
tar czf ../kaiwu-deploy.tgz \
  --exclude='__pycache__' --exclude='app.db' \
  --exclude='_backup*' --exclude='local_settings.py' \
  backend frontend/dist deploy
```

上传并初始化（把 `<IP>` 和 `<用户名>` 换成你的）：

```bash
cd /d/Onesummer_D/Learning/Competitons/NCDA
scp kaiwu-deploy.tgz <用户名>@<IP>:/tmp/

ssh <用户名>@<IP>
# 登录到服务器后：
sudo -i
mkdir -p /opt/kaiwu
tar xzf /tmp/kaiwu-deploy.tgz -C /opt/kaiwu
bash /opt/kaiwu/deploy/server_setup.sh
```

脚本会：装依赖 → 建虚拟环境 → 注册 systemd 服务（开机自启、崩溃自动重启）→ 启动。

## 第 3 步 · 配置 DeepSeek 密钥（可选）

不配置也能跑：AI 问答会自动降级为本地知识库回答（系统设计如此）。
要让线上 AI 问答生效：

```bash
nano /etc/systemd/system/kaiwu.service
# 找到 Environment=DEEPSEEK_API_KEY= 这行，填上你的 sk-xxx
systemctl daemon-reload && systemctl restart kaiwu
```

注意：线上用的是**正式环境**，建议单独观察密钥余额，比赛结束后可清空该行关掉 AI。

## 第 4 步 · 验证

1. 电脑浏览器打开 `http://<公网IP>:8100` —— 能看到开屏即成功
2. **手机流量（关掉 Wi-Fi）扫码测试** —— 确保外网真的通
3. 服务管理常用命令：

```bash
systemctl status kaiwu     # 看状态
systemctl restart kaiwu    # 重启
journalctl -u kaiwu -n 50  # 看最近 50 行日志
```

## 第 5 步 · 生成二维码

把 `http://<公网IP>:8100` 生成二维码，用在高分辨率展板上时**导出 SVG/PNG 大尺寸**，
300DPI 下建议二维码打印尺寸不小于 2.5cm，太小的码手机难对焦。

## 日常更新流程（改了代码之后）

```bash
# 本地：前端有改动则先 npm run build，然后重新打包
tar czf ../kaiwu-deploy.tgz --exclude='__pycache__' --exclude='app.db' \
  --exclude='_backup*' --exclude='local_settings.py' backend frontend/dist deploy
scp ../kaiwu-deploy.tgz <用户名>@<IP>:/tmp/

# 服务器：
sudo tar xzf /tmp/kaiwu-deploy.tgz -C /opt/kaiwu
sudo systemctl restart kaiwu
```

## 注意事项

- `app.db` 不上传：服务器首次启动会从 `content.json` 自动建库灌数据；
  如果改过内容数据，确认 `content.json` 是最新的再打包。
- `local_settings.py`（DeepSeek 密钥）永不上传、永不入库。
- IP+端口 是 HTTP 访问，不需要域名和备案；以后若换域名才需要考虑备案问题。
- 比赛评审前一周，用手机流量完整走一遍三种模式，确认服务器流量/密钥余额充足。
