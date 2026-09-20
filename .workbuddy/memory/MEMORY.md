# NCDA · 开物脉络（kaiwu-mailuo）项目备忘

## 项目
- NCDA「天工开物杯」参赛作品，新余工业研学系统。GitHub: https://github.com/Onesummer-D/NCDA（改动常在本地未推送，提交前先问）。
- 推送凭据：系统 credential helper（workbuddy 便携 GCM）里没存 GitHub 凭据会推失败（"could not read Username"）。**用 gh CLI 推**：先 `gh auth setup-git`（gh 已登录 Onesummer-D，走 keyring），再 push。`gh auth setup-git` 写 ~/.gitconfig 需要沙箱豁免。
- 2026-09-20 品牌定名：**开物四百年**（原"开物脉络"）。问答助手名保留「问个开物」。主题句「一块铁 · 近四百年」。
- 运行方式：用户双击根目录 `启动网站.bat`（uvicorn 0.0.0.0:8100 服务 frontend/dist + SQLite，bat 会显示局域网 IP 供手机访问）。**不要改动这个启动链路。**
- **2026-09-21 目录已更名：kaiwu-mailuo → `kaiwusibainian/`**（git mv，两个 commit 已推送 origin/main：afa5cfa 功能 + faf12fb 改名/README）。改名前需先停 8100 端口的 uvicorn（占目录锁）。.gitignore 含 app.db / local_settings.py（DeepSeek 密钥，绝不入库）/ _backup_*。
- 架构：backend FastAPI(8100, SQLite app.db, seed.py 幂等灌库——**改 content.json 不重启/不清库不生效**，需同步 UPDATE app.db)；frontend Vite/React，改前端需 `npm run build`。
- 数据备份：`backend/_backup_copy_20260920/`。

## 关键改动记录（2026-09-20/21）
- 开屏每次播放、视口自适应；splash bug（未定义 SPLASH_KEY）已修。
- 《现场文案润色方案》已落地（含新华每日电讯=证据 E08，E07 是教育部文件）。
- 三模式分流已实现：casual 无任务/无补一环/无考考你；curious 默认「变」因果视图；school 全量+课堂衔接。模式以 session 为准。
- 状态配色=赭金古铜（--st-exposed #cfa96b / --st-verified #8c6a2f / --st-gap #b8432c）；「下一站」古站墨黑、今站朱砂(modern-next)；A5→M1 过渡按钮「穿越四百年 → 去看今天的开物脉络」（豁免改名）。
- 文档页：about/guide/privacy/terms 四页独立，宽度 420px，无联系方式（占位已按用户要求删除）。
- 用户偏好：视觉决策喜欢看对比选项再选；文案禁止迂回立论/防御性表述；参赛物料（boards/、docs/）与平台代码分开对待。
- 研学时长逻辑：visitStart 在 startSession 时写入 localStorage，但恢复旧会话不更新 → 海报时长虚高（用户实测 1 分钟变 1.5 小时）。已修：store 初始化时时间戳超过 2 小时视为新到访重置为 now；海报端超 90 分钟显示「约半日」。
