# 航司仓位数据筛选技能

根据自定义规则对航司仓位信息进行筛选，提取符合条件的高价值数据。

## 核心功能

- 多维度规则筛选
- 高舱位自动提取（头等舱、商务舱、优选经济舱）
- 价格/服务筛选
- 自定义规则配置

## 快速开始

```bash
# 进入筛选技能目录
cd filter-skill

# 安装依赖
npm install

# 配置筛选规则
cp rules.example.json rules.json
# 编辑 rules.json 定义筛选规则

# 使用默认规则筛选
npm run filter -- --input ../collect-skill/output/data.json

# 指定规则文件
npm run filter -- --input data.json --rules custom-rules.json

# 输出筛选结果
npm run filter -- --input data.json --output filtered.json
```

## 筛选规则

### 规则配置示例

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

## 详细文档

- [SKILL.md](SKILL.md) - 筛选技能主文档

## 注意事项

1. 需要先执行 `npm install` 安装依赖
2. 筛选规则支持自定义配置，详见 `rules.example.json`
