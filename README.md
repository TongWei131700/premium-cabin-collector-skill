# 航司高舱信息采集与展示系统

本项目提供航司高舱信息的一站式采集、筛选和展示解决方案，包含三个独立的 skill 模块。

## 项目结构

```
airline-premium-cabin/
├── README.md                  # 项目说明
├── collect-skill/             # 采集技能
│   ├── SKILL.md              # 采集技能文档
│   └── config.example.json   # 配置示例
├── filter-skill/              # 筛选技能
│   ├── SKILL.md              # 筛选技能文档
│   └── rules.example.json    # 规则示例
└── display-skill/             # 展示技能
    ├── SKILL.md              # 展示技能文档
    └── config.example.json   # 配置示例
```

## 三大能力

### 1. 航司仓位信息采集 ([`collect-skill/`](collect-skill/SKILL.md:1))

自动从航司系统或 API 获取仓位信息，支持多渠道数据采集。

**核心功能：**
- 单航司/批量采集
- 定时自动采集
- 多格式数据导出

**快速开始：**
```bash
cd collect-skill
npm install
npm run collect -- --airline CA
```

### 2. 航司数据筛选 ([`filter-skill/`](filter-skill/SKILL.md:1))

根据自定义规则对航司仓位信息进行筛选，提取符合条件的高价值数据。

**核心功能：**
- 多维度规则筛选
- 高舱位自动提取
- 价格/服务筛选

**快速开始：**
```bash
cd filter-skill
npm install
npm run filter -- --input ../collect-skill/output/data.json
```

### 3. 页面展示生成 ([`display-skill/`](display-skill/SKILL.md:1))

根据筛选后的数据自动生成美观的展示页面，支持多种模板。

**核心功能：**
- 自动生成 HTML 页面
- 多种预设模板
- 响应式布局

**快速开始：**
```bash
cd display-skill
npm install
npm run generate -- --input ../filter-skill/output/filtered.json
```

## 完整工作流程

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   采集技能       │ →  │   筛选技能       │ →  │   展示技能       │
│ collect-skill   │    │ filter-skill    │    │ display-skill   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ 获取航司仓位数据  │    │ 应用筛选规则     │    │ 生成展示页面     │
│ 输出: data.json │ →  │ 输出: filtered  │ →  │ 输出: index.html│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 使用示例

### 完整流程

```bash
# 1. 采集数据
cd collect-skill
npm run collect -- --airlines CA,CZ,MU --output ../data/raw.json

# 2. 筛选数据
cd ../filter-skill
npm run filter -- --input ../data/raw.json --rules ./rules/premium.json --output ../data/filtered.json

# 3. 生成页面
cd ../display-skill
npm run generate -- --input ../data/filtered.json --template premium --output ../output/

# 4. 预览页面
npm run preview -- --dir ../output/
```

## 各技能详细文档

- [采集技能文档](collect-skill/SKILL.md)
- [筛选技能文档](filter-skill/SKILL.md)
- [展示技能文档](display-skill/SKILL.md)

## 注意事项

1. 确保已配置正确的航司 API 密钥
2. 筛选规则支持自定义配置
3. 展示模板支持自定义开发
