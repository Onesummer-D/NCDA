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
- 配色语义（权威源 index.css:14-20 与 docs/海报文案库-设计规范与用户画像.md）：**时代色 古=朱砂 #b8432c(--era-ancient) / 今=钢青 #3e4a57(--steel)**——先前记录的「古站墨黑、今站朱砂」有误，.modern-next 过渡按钮只是用 var(--era-ancient) 当底色；掌握状态色 赭金 #cfa96b 已接触 / 古铜 #8c6a2f 已验证 / 朱砂 #b8432c 断点（与「古」同色值，四百年前断掉的那一环即今天的认知断点）；墨 #1c1915、画布纯白；A5→M1 过渡按钮「穿越四百年 → 去看今天的开物脉络」（豁免改名）。
- 文档页：about/guide/privacy/terms 四页独立，宽度 420px，无联系方式（占位已按用户要求删除）。
- 用户偏好：视觉决策喜欢看对比选项再选；文案禁止迂回立论/防御性表述；参赛物料（boards/、docs/）与平台代码分开对待。
- 研学时长逻辑：visitStart 在 startSession 时写入 localStorage，但恢复旧会话不更新 → 海报时长虚高（用户实测 1 分钟变 1.5 小时）。已修：store 初始化时时间戳超过 2 小时视为新到访重置为 now；海报端超 90 分钟显示「约半日」。
- **GitHub Pages 静态演示版已上线**：https://onesummer-d.github.io/NCDA/ （gh-pages 分支）。api.ts 无后端时自动进 STATIC_DEMO：内容读 `${BASE_URL}content.json`（prebuild 从 backend/data 拷到 public/，**改 content.json 需 rebuild 重部署**）、会话/信号/开物谱状态走 localStorage（kaiwu_demo_states_v1）、补一环在 apiDemo.ts、问答/教师端如实提示未连接。vite base=/NCDA/。重部署：npm run build → dist 内建临时 git 仓库 push -f 到 gh-pages → 删 dist/.git。

## 公网部署决策（2026-09-21，晚间更新）
- **硬 deadline：2026-09-23（周三）成果提交**。备案≠部署：裸 IP 直访不需要备案（备案仅配域名才要）。
- **已上线（09-21 03:40）**：`http://81.70.40.146:8100`（广州轻量校园版 2核2G4M Ubuntu 24.04，25.92元/3个月，**约 12-21 到期**，SSH 用户 ubuntu，systemd 常驻开机自启，DeepSeek key 已挂 /opt/kaiwu/backend/local_settings.py）。验证全 200 含 /api/qa 流式真答。展板二维码：`参赛物料/二维码-开物四百年-公网入口.png`（888px H 容错）。更新部署：build:cos → tar（排除敏感文件）→ `.workbuddy/tmp/remote_deploy.py`（paramiko，KAIWU_SSH_PW 传密码）。 完整版（2026-09-21 验证）：build:cos → tar → remote_deploy.py → **remote_patch.py**（content.json 改动必须额外 UPDATE 服务器存量 app.db + 显式 systemctl restart，server_setup 的 enable --now 不重启已运行服务）；deploy 后本地要 plain `npm run build` + 重建 dist/NCDA junction（build:cos 清 dist 会把 junction 清掉）。paramiko 在托管 venv（venv 重建于 09-21 晚，**Windows 下解释器实际路径是 `envs\default\Scripts\python.exe`，venv 根目录没有 python.exe**；venv 消失时用 3.13.12 managed python 重建 + pip install paramiko）。增量更新用 `.workbuddy/tmp/remote_update.py`（解包+重启+自检，纯前端改动够用），首次/大改才用 remote_deploy.py。**铁律：remote_update 前必须现跑 build:cos 再 tar——绝不能把本地 plain build（base=/NCDA/）的 dist 打包上去（2026-09-22 踩过，线上资源 404）；plain build+junction 只在 deploy 完成之后做。** backend main.py 已加 _cache_control 中间件：index.html no-cache、/assets/* immutable 一年，发布即生效无需用户强刷。加固待办：教师端口令门、SSH 改密、续费、DeepSeek 余额。
- 用户拍板上线**带后端完整版**（COS 静态教程不满足）。**实名已完成**。预算受限（"38/月买不起"）→ 主路线定为**国内轻量 + IP:8100 直访（A 线，无域名免备案）**：购买优先级=①腾讯云免费试用（0元立刻用）→②新人特惠国内 2核2G3M 约 61-82元/年（无额外认证，deadline 首选）→③学生云+校园 25.92元/3个月（需学生认证，别让它卡 deadline）→④秒杀。**B 线（域名+HTTPS）因预算+备案时限放弃**，展板二维码用 `http://IP:8100`。保底：GitHub Pages 静态版二维码已在跑，服务器翻车就先用它。给 IP+SSH 后由我接手部署（deploy/DEPLOY.md、server_setup.sh、kaiwu.service 齐备，流程=build→tar 排除敏感文件→scp→setup→防火墙 8100→seed→实测→出二维码）。
- COS+CDN 静态备用线路脚本在 deploy/（upload_to_cos.py / refresh_cdn.py / README.md；`npm run build:cos`=base=/ 构建）。坑：2024 后新 COS 桶默认域名强制下载 html，CDN 响应头 html→Content-Disposition:inline 兜底。

## 参赛物料规格与素材（2026-09-21）
- NCDA 必交：①基础信息+设计说明≤500字 ②作品文件≤5张 JPG（≥A3、300DPI、RGB/CMYK、单张≤5M）③宣传海报 竖版A3 一张（300DPI JPG RGB ≤5M）。选交：宣讲视频 MP4≤3min≤300M。海报≠作品文件，分开做。
- 版面素材：`参赛物料/平台截图-420px/`（19张，420×900@2x，含长图），截图脚本 `C:\Users\Deng\.workbuddy\binaries\node\workspace\capture-*.mjs`（playwright-core 直驱 Chrome，agent-browser 已弃用）。
- 本地服务坑：8100 双 uvicorn 会随机 404（Windows 双绑定）→只留一个；gh-pages dist（base=/NCDA/）本地根挂载 404 → `frontend/dist/NCDA` junction 自映射已建。**任何 npm run build（plain 也算）都会清掉 junction → 每次 build 后必须重建：New-Item -ItemType Junction dist\NCDA -Target dist（PowerShell）**。
- 研学海报（poster.ts）：2026-09-21 起 2x 渲染导出（canvas.width=W*2 + ctx.scale(2,2)，720 逻辑宽→1440 物理宽），修手机高分屏/微信传输发糊；「我带走的知识」行距 23px、ROW_H 112。验证脚本 `C:\Users\Deng\.workbuddy\binaries\node\workspace\verify-poster.mjs`（需本地 8100 服务在跑）。
- 本会话工具坑：bash 沙箱缺 coreutils 且 npm shebang 挂 → 用 PowerShell；PowerShell 工具 stdout 常被吞 → 输出写临时文件再 Read。
- 文案硬规矩（2026-09-21 用户明确）：所有讲解文案禁止破折号、禁止迂回立论（反问句开头）、禁止防御性表述（如"需对照校核"）；学科知识要写具体——化学写化学式、物理写受力分析。课堂衔接数据源 curriculum_links，改文案要同步 content.json + app.db UPDATE + 重新 build。
- 参赛文案高亮三档体系（2026-09-22 确立，用于简介/设计说明段落）：档一=朱砂实底，标价值落点或语义端点（每段最多 1 处，logo 段/配色段可放宽到 2-3 处）；档二=加粗+古铜下划线，标原创机制、专业动作、转译点；档三=仅加粗，标具体实体与受众考量。核心原则：只标实物上看不见的因果（出处、映射、设计意图），不标评委一眼可见的东西（颜色名、构图、留白），也不标抒情收尾句（标了会把结论降级成修辞）。配套规则：一段只准一处档一；跨段不重复染同一词；标结果不标手段；高亮总量≤25%。
