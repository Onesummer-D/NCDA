# 开物四百年 · 腾讯云 COS + CDN 部署指南

> 目标：静态演示版部署到自有域名（COS 香港 + CDN + 免费 HTTPS），全程免备案。
> 对照教程卡片逐条落地，这里只写本项目的专属参数和实际会踩的坑。

## 先想清楚的一件事

COS/CDN 只能托管**静态演示版**（和现在 GitHub Pages 同级）：开屏、研学年谱、三模式、补一环都能用；
「问个开物」问答、教师端数据需要后端（FastAPI + DeepSeek），只在本地 `启动网站.bat` 里可用。

## 前置准备（需要你操作）

- [ ] 腾讯云账号并完成个人实名认证（console.cloud.tencent.com）
- [ ] 一个域名：成品域名 ¥7-8/年最划算，或在腾讯云直接买；买完完成实名
  - 解析托管在腾讯云 DNSPod 最省事（证书自动 DNS 验证直接授权即可）
- [ ] API 密钥：控制台右上角 → 账号中心 → 访问管理 → API 密钥管理 → 新建密钥
  - 记下 SecretId / SecretKey（**只显示一次**），填进 `deploy/.env`（复制 `.env.example`）
  - **绝不写进代码、绝不提交 GitHub**

## STEP 1 创建 COS 存储桶（你，控制台）

| 配置项 | 值 | 说明 |
|---|---|---|
| 名称 | `kaiwu-<你的APPID>` | APPID 在控制台「账号信息」页；重名就换前缀 |
| 地域 | `ap-hongkong` | 境外，不触发备案 |
| 访问权限 | **公有读私有写** | 必须选这个 |
| 其余 | 单 AZ / 关版本控制 / 不加密 | 保持默认 |

⚠️ **与教程卡片不同的重要提醒**：2024-01-01 之后创建的桶，官方安全策略规定用默认域名访问
**任何文件都直接下载、不支持预览**。所以「浏览器打开 index.html 能看到页面」这一步对新桶不成立——
看到下载**不算失败**。验证方式改为：打开
`http://<桶名>.cos.ap-hongkong.myqcloud.com/content.json` 能拉到内容即桶配好了。
页面能否正常渲染取决于 STEP 3 的响应头兜底配置。

## STEP 2 构建 + 上传（我，脚本）

```bash
cd kaiwusibainian/frontend
npm run build:cos        # 以 base=/ 构建（区别于 GitHub Pages 的 /NCDA/）

cd ../deploy
python upload_to_cos.py  # 全量上传、同名覆盖；加 --clean 可删除远端多余文件
```

## STEP 3 配置 CDN（你，控制台）

| 配置项 | 值 |
|---|---|
| 加速域名 | `www.<你的域名>` |
| 加速区域 | 中国境外（和香港桶匹配） |
| 加速类型 | CDN 网页小文件 |
| IPv6 | 关 |

**源站（最容易踩坑）**：源站类型选「COS 源」，模式选**默认域名**
（`xxx.cos.ap-hongkong.myqcloud.com`）。
不要选「静态网站」（会回源失败 502），不要选「全球加速」（收费）。

**必做的兜底配置（教程卡片没写，但新桶一定会遇到）**：
CDN 域名管理 → 该域名 → 高级配置 → HTTP 响应头 → 添加规则：
文件后缀 `html` → **设置** `Content-Disposition: inline`

> 原因：COS 新桶策略会在响应头强制 `Content-Disposition: attachment`，CDN 会原样透传，
> 不加这条规则访客打开网站会变成「下载 index.html」。用「设置」模式覆盖它。

## STEP 4 免费 SSL 证书（你，控制台）

1. SSL 证书控制台 → 申请免费证书 → 绑定 `www.<你的域名>`（免费证书 90 天，每域名限 1 张，到期重新申请）
2. 验证方式选**自动 DNS 验证**，勾选「SSL 证书服务授权」→ 5-10 分钟自动签发
3. 回 CDN 域名管理 → HTTPS 配置 → 选「已托管证书」→ 开启**强制 HTTPS**

## STEP 5 DNS 解析（你，域名解析处）

| 主机记录 | 类型 | 记录值 |
|---|---|---|
| www | CNAME | CDN 分配的加速域名（形如 `xxx.cdn.dns1.com`） |

- 域名之前绑过 Vercel 等服务，先删旧记录
- Windows 验证：`ipconfig /flushdns` 后 `nslookup www.<你的域名>`，结果含 `cdn.dns1.com` 即生效

## 日常更新（3 条命令，约 5 分钟）

```bash
cd kaiwusibainian/frontend && npm run build:cos
cd ../deploy && python upload_to_cos.py
python refresh_cdn.py
```

## 踩坑速查

| 现象 | 原因 → 解法 |
|---|---|
| 打开网站变成下载 index.html | 新桶强制下载策略 → STEP 3 的 `inline` 响应头规则没配或没生效，配完跑一次 `refresh_cdn.py` |
| 502 / 404 | CDN 源站选错 → 改回「默认域名」模式 |
| 证书一直「验证中」 | 手动 DNS 验证容易错 → 换自动 DNS 验证 |
| 改了 DNS 还访问旧站 | 本地缓存 → `ipconfig /flushdns`；HSTS → 无痕窗口，或 `chrome://net-internals/#hsts` 删除该域名策略 |
| 更新后页面没变 | CDN 缓存 → `refresh_cdn.py`，或控制台缓存刷新 → URL 刷新 |

## 费用与提醒

- 参考月成本 ¥2-5（COS 存储 + 境外 CDN 流量），域名费另计
- 中国境外加速节点对大陆访客「可用但不算快」；要国内速度需备案域名 + 中国境内加速，属另一套方案
- 密钥一旦泄露 → 立刻到访问管理禁用并重建，同步更新 `deploy/.env`
