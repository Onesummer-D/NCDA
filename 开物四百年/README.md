# 开物四百年（Kaiwu Sibainian）

> NCDA 未来设计师大赛 ·「天工开物杯」参赛作品（数字智能方向）
> 面向新余工业研学场景的古今工艺认知导航系统

## 项目简介

《开物四百年》以「同一道造物问题的古今不同解法」为文化主线，将取材、控火、提纯、成形、控性等冶金过程组织为可交互的工艺认知网络。地域基底为凤凰山古铁冶遗存、《天工开物》地方文化关联与当代新余钢铁产业链——从宋应星写下《天工开物》到今天新钢的炉台，正好是一道工序题的四百年。

系统核心特点：

- **三种参观方式分流** —— 「轻松看看」纯故事导览不安排任务；「想看懂」默认打开古今因果视图，认知导航全程陪伴；「学校研学」含观察任务与课堂衔接，教师端可查看群体理解情况
- **物理路线固定，认知内容动态适配** —— 现场优先、屏幕退后，系统只调整观察重点与解释深度
- **Gap Engine 可解释推荐** —— 规则透明（前置缺口 > 叙事连续 > 课程相关 − 重复 − 负担），不使用黑盒模型
- **古今关系三型标注** —— 史料关联 / 功能类比 / 设计解释，每条关系带证据来源
- **证据约束问答** —— 知识库未命中时明确回答「暂未支持」，不编造冶金史
- **开物谱真实状态呈现** —— 只输出未接触 / 已接触 / 已验证 / 出现断点，不生成无依据的掌握度百分比

## 仓库结构

```
NCDA/
├── kaiwusibainian/                # 参赛作品本体
│   ├── backend/                   # FastAPI + SQLite 服务
│   │   ├── main.py                #   全部 API（内容/会话/信号/Gap Engine/证据问答/开物谱/教师端）
│   │   ├── schema.sql             #   数据层（工艺节点/关系边/任务/课程映射/认知信号）
│   │   ├── seed.py                #   content.json → SQLite 灌库
│   │   ├── demo_data.py           #   教师端示例班级数据
│   │   └── data/content.json      #   内容模型：7 造物问题 · 11 工艺节点 · 15 关系边 · 8 课程映射 等
│   ├── frontend/                  # React 19 + TypeScript + Vite
│   │   └── src/screens/           #   学生端五大模块（Home/Walk/Spectrum/Craft/Qa）+ 教师端
│   ├── boards/                    # 五张 A3 方案板 + 宣传海报
│   │   ├── final/                 #   投稿用 300DPI JPG（≤5MB，可直接上传）
│   │   └── render/                #   渲染中间 PNG
│   ├── shots/                     # 系统真实界面截图
│   └── docs/                      # A/B 测试工具包 · 投稿清单与设计说明
├── 启动网站.bat                    # 一键启动（自动显示局域网地址，手机同 Wi-Fi 可访问）
├── 《开物四百年》天工开物杯项目执行计划与技术设计文档.docx
├── 《开物四百年》深度研究与技术设计文档.pdf
└── 关于2026年未来设计师大赛多项专题赛及教师教学创新赛的参赛通知.pdf
```

## 快速开始

环境要求：Python 3.13+、Node.js 18+

**方式一（推荐）**：双击根目录 `启动网站.bat`，服务起在 `0.0.0.0:8100`，窗口会显示局域网地址，手机连同一 Wi-Fi 可直接访问。

**方式二（手动）**：

```bash
# 1. 构建前端
cd kaiwusibainian/frontend && npm install && npm run build

# 2. 启动服务（同时提供页面 + API）
cd ../backend && python -m uvicorn main:app --host 0.0.0.0 --port 8100
```

- 学生端：<http://localhost:8100>
- 教师端：<http://localhost:8100/#/teacher>

首次启动会自动建库；如需重新生成示例班级数据，删除 `backend/app.db` 后运行 `python backend/demo_data.py`。

更多运行细节（开发模式热更新、板面重新渲染等）见 [kaiwusibainian/README.md](kaiwusibainian/README.md)。

## 技术栈

| 层 | 技术 |
|---|---|
| 学生端 / 教师端 | React 19 · TypeScript · Vite · PWA（移动壳） |
| 后端服务 | FastAPI · SQLite（WAL） |
| 内容模型 | JSON 内容库 → 关系型数据层（节点 / 边 / 任务 / 信号） |
| 投稿物料 | HTML 方案板 + headless Edge 渲染 → 300DPI A3 JPG |

## 文档

- [项目运行与设计原则详情](kaiwusibainian/README.md)
- [投稿清单与设计说明](kaiwusibainian/docs/投稿清单与设计说明.md)
- [A/B 测试工具包](kaiwusibainian/docs/AB测试工具包.md)
