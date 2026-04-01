---
name: airline-cabin-filter
description: 根据规则筛选航司仓位信息，提取符合规则的数据
---

# 航司仓位数据筛选

根据自定义规则对航司仓位信息进行筛选，提取符合条件的高价值数据。

## 触发条件

当需要以下功能时触发：
- 按规则筛选航司仓位
- 提取高舱位信息
- 过滤符合条件的航线
- 根据业务规则筛选数据

## 核心能力

| 能力 | 说明 |
|------|------|
| 规则筛选 | 根据多维度规则筛选数据 |
| 高舱提取 | 提取头等舱、商务舱等高价值仓位 |
| 价格过滤 | 按价格区间筛选 |
| 服务筛选 | 按包含的服务筛选 |

## 快速开始

### 安装配置

```bash
# 进入筛选技能目录
cd filter-skill

# 安装依赖
npm install

# 配置筛选规则
cp rules.example.json rules.json
# 编辑 rules.json 定义筛选规则
```

### 使用示例

```bash
# 使用默认规则筛选
npm run filter -- --input ../collect-skill/output/data.json

# 指定规则文件
npm run filter -- --input data.json --rules custom-rules.json

# 输出筛选结果
npm run filter -- --input data.json --output filtered.json
```

## 筛选规则

### 规则配置

```json
{
  "rules": [
    {
      "name": "高舱筛选",
      "condition": "AND",
      "filters": [
        {"field": "cabinCode", "operator": "in", "value": ["F", "J", "C", "D"]},
        {"field": "services", "operator": "contains", "value": "贵宾休息室"}
      ]
    }
  ]
}
```

### 支持的运算符

| 运算符 | 说明 | 示例 |
|--------|------|------|
| eq | 等于 | `{"field": "cabinCode", "operator": "eq", "value": "F"}` |
| ne | 不等于 | `{"field": "cabinCode", "operator": "ne", "value": "Y"}` |
| in | 包含于 | `{"field": "cabinCode", "operator": "in", "value": ["F", "J"]}` |
| contains | 包含 | `{"field": "services", "operator": "contains", "value": "休息室"}` |
| gt | 大于 | `{"field": "price", "operator": "gt", "value": 5000}` |
| lt | 小于 | `{"field": "price", "operator": "lt", "value": 10000}` |

## API 接口

### `filter(data, rules)`

根据规则筛选航司数据。

**参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| data | object\|array | 是 | 待筛选的航司数据 |
| rules | array | 是 | 筛选规则列表 |

**返回：**

```typescript
{
  matched: CabinInfo[]      // 符合条件的数据
  unmatched: CabinInfo[]    // 不符合条件的数据
  summary: {
    total: number
    matched: number
    rules: string[]
  }
}
```

## 预设规则模板

### 高舱模板

```json
{
  "name": "高舱位筛选",
  "filters": [
    {"field": "cabinCode", "operator": "in", "value": ["F", "A", "J", "C", "D", "I"]},
    {"field": "cabinType", "operator": "in", "value": ["头等舱", "商务舱"]}
  ]
}
```

### 服务筛选模板

```json
{
  "name": "贵宾服务筛选",
  "filters": [
    {"field": "services", "operator": "contains", "value": "贵宾休息室"},
    {"field": "services", "operator": "contains", "value": "优先登机"}
  ]
}
```
