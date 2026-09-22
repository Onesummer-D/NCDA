# 开物四百年（Kaiwu Sibainian）

面向工业研学的古今工艺认知导航系统——NCDA「天工开物杯」参赛作品（数字智能方向）。

以「同一道造物问题的古今不同解法」为文化主线，以工艺因果关系与知识缺口感知为智能内核，
以课程映射、现场观察和研学反馈为落地价值。地域基底：凤凰山古铁冶 ·《天工开物》 · 新余现代钢铁产业链。

## 目录结构

```
kaiwusibainian/
├── backend/            FastAPI + SQLite 服务
│   ├── main.py         全部 API（内容/会话/信号/Gap Engine/证据问答/开物谱/教师端）
│   ├── schema.sql      数据层（工艺节点/关系边/任务/课程映射/认知信号）
│   ├── seed.py         content.json → SQLite 灌库
│   ├── demo_data.py    教师端示例班级数据（板面已标注"示例数据"）
│   ├── deepseek.py     DeepSeek 客户端（问答流式生成 + 教师端 AI 建议）
│   ├── local_settings.py   DeepSeek 密钥（本地私密配置，已 gitignore；模板见 local_settings.example.py）
│   └── data/content.json   内容模型：7 造物问题 · 11 工艺节点 · 15 关系边 · 8 课程映射 · 5 观察任务 · 11 解释卡 · 22 问答条目 · 6 证据源
├── frontend/           React + TS + Vite 学生端 PWA（移动壳）+ 教师端（#/teacher）
├── boards/             五张 A3 方案板 + 宣传海报（HTML 源 + kit.css 设计系统）
│   ├── final/          投稿用 300DPI JPG（≤5MB）
│   └── render/         渲染中间 PNG
├── shots/              系统真实界面截图（供板面使用）
└── docs/               A/B 测试工具包 · 投稿清单与设计说明
```

## 运行

**推荐（生产模式，一个端口全搞定）：**

```bash
# 1. 构建前端（改过前端代码后需要重新执行）
cd frontend && npm install && npm run build

# 2. 配置 DeepSeek 密钥（问答 AI 与教师端 AI 建议）
#    方式 A：复制 backend/local_settings.example.py 为 backend/local_settings.py 并填入密钥
#    方式 B：设环境变量 DEEPSEEK_API_KEY=sk-xxxx

# 3. 启动服务（同时提供页面 + API；需 pip install httpx fastapi uvicorn）
cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8100
```

- 学生端：<http://localhost:8100>
- 教师端：<http://localhost:8100/#/teacher>

> DeepSeek 接入说明：问答为「知识库全量上下文 + deepseek-chat 流式生成」，回答优先依据资料库并挂证据来源，超纲问题礼貌拒答；接口异常时自动降级回本地知识库检索，系统不因大模型故障不可用。教师端「建议」按数据指纹缓存并在后台线程生成（页面每 15 秒自动刷新，数据不变不重复调用），生成期间先显示规则话术。

**开发模式（可选，前端热更新）：**

```bash
# 后端（端口 8100）
cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8100

# 前端（端口 5173，已代理 /api 到 8100）
cd frontend && npm run dev
```

```bash
# 重新生成示例班级数据（先删 backend/app.db 再 seed）
python backend/demo_data.py

# 重新渲染板面（改 boards/*.html 后）
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new \
  --disable-gpu --window-size=4960,3508 \
  --screenshot=boards/render/a3-01.png "file:///…/boards/a3-01.html"
# 再用 Pillow 转 300DPI JPG（见 docs/投稿清单与设计说明.md）
```

## 设计原则（对应技术设计文档冻结项）

- 物理路线安全固定，认知内容动态适配；现场优先、屏幕退后。
- Gap Engine 为可解释规则（前置缺口 > 叙事连续 > 课程相关 − 重复 − 负担），不用黑盒。
- 古今关系三型标注：史料关联 / 功能类比 / 设计解释；每条关系带 evidence_ids。
- 问答证据约束：DeepSeek 生成时以资料库为上下文、优先依据资料作答，超纲明确说明；DeepSeek 不可用时自动降级回本地知识库检索，不编造冶金史。
- 开物谱只用真实状态（未接触/已接触/已验证/出现断点），不输出无依据的掌握度百分比。
