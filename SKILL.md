---
name: premium-cabin-collector-skill
description: 航司高舱信息采集、筛选与展示系统，包含采集、筛选、展示三个独立技能模块
---

# 航司高舱信息采集与展示系统

系统化收集航空公司高舱机型资料，并整理成可复用的数据目录和展示页面。本项目包含三个独立的 skill 模块，形成完整的工作流。

## 技能模块概览

| 模块 | 路径 | 功能说明 |
|------|------|----------|
| **采集技能** | [`collect-skill/`](collect-skill/SKILL.md) | 从 seatmaps.com 抓取航司机型数据、座位图、舱位信息、图片等 |
| **筛选技能** | [`filter-skill/`](filter-skill/SKILL.md) | 根据规则筛选高舱数据，提取头等舱、商务舱等高价值信息 |
| **展示技能** | [`display-skill/`](display-skill/SKILL.md) | 根据筛选后的数据自动生成美观的展示页面 |

## 触发条件

当用户需要以下功能时触发使用：
- 抓取某家航司的全部或部分机型数据
- 抓取某机型的 seatmap / 舱位 / 评价与配图
- 下载 seatmaps 相关图片并分类归档
- 建立或维护航司机型数据库、机型详情文档
- 筛选高舱位数据（头等舱、商务舱等）
- 生成航司高舱信息展示页面

**常见触发词**：seatmaps、座位图、机型详情、舱位配置、航司数据库、飞机图片整理、高舱筛选、页面展示

---

## 完整工作流程

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   采集技能       │ →  │   筛选技能       │ →  │   展示技能       │
│ collect-skill   │    │ filter-skill    │    │ display-skill   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ 抓取航司机型数据  │    │ 应用筛选规则     │    │ 生成展示页面     │
│ 分类整理图片     │    │ 提取高舱数据     │    │ 输出 HTML 页面  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 各模块详细说明

### 1. 采集技能 ([`collect-skill/`](collect-skill/SKILL.md))

从 seatmaps.com 系统化采集航空公司机型资料。

> 📹 **运行效果演示**：[查看视频](https://cloud.video.taobao.com/vod/Bsog7tVppJAwmxdHt-hDuWjcocO72XwVtE3MZA0G4-8.mp4)

**核心功能：**
- 单航司/批量机型抓取
- 自动下载并分类图片（6 类目录结构）
- 自动去重
- 生成机型详情文档

**快速开始：**
```bash
# 抓取单个航司全部机型
cd collect-skill
python scripts/scrape_seatmaps.py --airline "新加坡航空" --output ../output/

# 已有数据，仅分类 + 去重
node scripts/classify-images-v2.js --airline "新加坡航空"
node scripts/dedup-images.js --airline "新加坡航空"
```

**详细文档：**
- [`collect-skill/SKILL.md`](collect-skill/SKILL.md) - 主入口、门禁规则、9 阶段工作流程
- [`collect-skill/references/reference.md`](collect-skill/references/reference.md) - 输出目录规范、Phase 命令、验收标准
- [`collect-skill/references/examples.md`](collect-skill/references/examples.md) - 典型用法示例
- [`collect-skill/scripts/README.md`](collect-skill/scripts/README.md) - 脚本清单与职责

---

### 2. 筛选技能 ([`filter-skill/`](filter-skill/SKILL.md))

根据自定义规则对航司仓位信息进行筛选，提取符合条件的高价值数据。

**核心功能：**
- 多维度规则筛选
- 高舱位自动提取（头等舱、商务舱、优选经济舱）
- 价格/服务筛选
- 自定义规则配置

**快速开始：**
```bash
cd filter-skill
npm install
npm run filter -- --input ../output/航司数据.json --rules ./rules/premium.json --output ../output/filtered.json
```

**详细文档：**
- [`filter-skill/SKILL.md`](filter-skill/SKILL.md) - 筛选技能主文档

---

### 3. 展示技能 ([`display-skill/`](display-skill/SKILL.md))

> 📹 **运行效果演示**：[查看视频](https://cloud.video.taobao.com/vod/Tn7dq3pCXh6DLvLeP5E0Q57Qx8h_1yWqSAiiYh0abHw.mp4)

根据筛选后的数据自动生成美观的展示页面。

**核心功能：**
- 自动生成 HTML 页面
- 多种预设模板
- 响应式布局
- 支持自定义模板开发

**快速开始：**
```bash
cd display-skill
npm install
npm run generate -- --input ../output/filtered.json --template premium --output ../output/pages/
```

**详细文档：**
- [`display-skill/SKILL.md`](display-skill/SKILL.md) - 展示技能主文档

---

## 完整使用示例

### 一站式流程

```bash
# 1. 采集数据
cd collect-skill
python scripts/scrape_seatmaps.py --airline "新加坡航空 SQ" --output ../output/FlightData/

# 2. 筛选高舱数据
cd ../filter-skill
npm run filter -- --input ../output/FlightData/ --rules ./rules/premium.json --output ../output/filtered.json

# 3. 生成展示页面
cd ../display-skill
npm run generate -- --input ../output/filtered.json --template premium --output ../output/pages/

# 4. 预览页面
npm run preview -- --dir ../output/pages/
```

---

## 项目结构

```
premium-cabin-collector-skill/
├── README.md                     # 项目说明
├── SKILL.md                      # 本文件：技能总入口
├── collect-skill/                # 采集技能
│   ├── SKILL.md
│   ├── references/
│   │   ├── reference.md
│   │   └── examples.md
│   └── scripts/
│       ├── README.md
│       ├── scrape_seatmaps.py
│       ├── batch-process.js
│       ├── classify-images-v2.js
│       └── dedup-images.js
├── filter-skill/                 # 筛选技能
│   ├── SKILL.md
│   └── rules.example.json
├── display-skill/                # 展示技能
│   ├── SKILL.md
│   └── config.example.json
└── references/                   # 项目级参考资料
    ├── guide.md
    ├── api.md
    └── faq.md
```

---

## 注意事项

1. **采集技能**需要先安装 Python 依赖：`pip install requests beautifulsoup4`
2. **筛选/展示技能**需要先执行 `npm install` 安装依赖
3. 采集技能默认需要配置 Claude Code 的 dangerous 权限，详见 [`collect-skill/SKILL.md`](collect-skill/SKILL.md)
4. 输出数据默认保存到 `output/` 目录（可在命令中通过 `--output` 指定）

---

## 参考资料

- [详细指南](./references/guide.md)
- [API 文档](./references/api.md)
- [常见问题](./references/faq.md)
