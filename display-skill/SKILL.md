---
name: airline-cabin-display
description: 根据筛选后的航司数据生成页面展示
---

# 航司仓位页面展示

根据筛选后的航司数据自动生成美观的展示页面，支持多种展示模板和自定义样式。

## 触发条件

当需要以下功能时触发：
- 生成航司仓位展示页面
- 创建高舱信息看板
- 生成数据报告页面
- 定制化展示页面开发

## 核心能力

| 能力 | 说明 |
|------|------|
| 页面生成 | 自动生成完整的 HTML 页面 |
| 模板选择 | 提供多种预设展示模板 |
| 组件化 | 模块化展示组件 |
| 响应式 | 适配多端展示 |

## 快速开始

### 安装配置

```bash
# 进入展示技能目录
cd display-skill

# 安装依赖
npm install

# 配置展示选项
cp config.example.json config.json
# 编辑 config.json 配置模板和样式
```

### 使用示例

```bash
# 使用默认模板生成页面
npm run generate -- --input ../filter-skill/output/filtered.json

# 指定模板
npm run generate -- --input data.json --template premium

# 自定义输出目录
npm run generate -- --input data.json --output ./pages/

# 启动预览服务
npm run preview
```

## 模板说明

### 预设模板

| 模板 | 说明 | 适用场景 |
|------|------|----------|
| `premium` | 高端奢华风格 | 头等舱、商务舱展示 |
| `list` | 列表清单风格 | 数据对比展示 |
| `card` | 卡片网格风格 | 多航司对比 |
| `table` | 表格对比风格 | 详细参数对比 |

### 使用模板

```bash
# 使用高端模板
npm run generate -- --template premium --input data.json

# 使用卡片模板
npm run generate -- --template card --input data.json
```

## 页面组件

### 头部组件 Header

展示页面标题和概览信息。

### 仓位卡片 CabinCard

展示单个仓位的详细信息。

```html
<CabinCard
  airline="中国国际航空"
  cabin="头等舱"
  code="F"
  price="¥18,000"
  services={["贵宾休息室", "优先登机", "额外行李"]}
/>
```

### 对比表格 CompareTable

多航司仓位对比表格。

### 服务标签 ServiceTags

展示仓位包含的服务项目。

## API 接口

### `generate(data, options)`

生成展示页面。

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| data | object\|array | 是 | 筛选后的航司数据 |
| options | object | 否 | 生成选项 |

**options：**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| template | string | 'premium' | 模板名称 |
| outputDir | string | './output' | 输出目录 |
| title | string | '航司高舱信息' | 页面标题 |
| theme | string | 'default' | 主题风格 |

**返回：**

```typescript
{
  success: boolean
  outputPath: string      // 生成的文件路径
  url: string            // 预览地址
}
```

## 自定义模板

### 创建自定义模板

在 `templates/custom/` 目录下创建模板文件：

```
templates/
├── premium/           # 高端奢华模板
├── list/              # 列表模板
├── card/              # 卡片模板
└── custom/            # 自定义模板
    ├── index.html
    ├── style.css
    └── script.js
```

### 模板变量

```html
<h1>{{title}}</h1>
<div class="airline">
  <span>{{airlineName}}</span>
  <span>{{airlineCode}}</span>
</div>
<ul class="cabins">
  {{#each cabins}}
  <li>{{cabinName}} - {{cabinCode}}</li>
  {{/each}}
</ul>
```

## 样式定制

### 主题配置

```json
{
  "theme": {
    "primaryColor": "#1a1a1a",
    "accentColor": "#c9a962",
    "fontFamily": "'PingFang SC', sans-serif"
  }
}
```

### CSS 变量

```css
:root {
  --primary-color: #1a1a1a;
  --accent-color: #c9a962;
  --card-bg: #ffffff;
  --text-primary: #333333;
}
```
