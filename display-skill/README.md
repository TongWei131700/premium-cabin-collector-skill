# 航司仓位页面展示技能

根据筛选后的航司数据自动生成美观的展示页面，支持多种展示模板和自定义样式。

> 📹 **运行效果演示**：[查看视频](https://cloud.video.taobao.com/vod/Tn7dq3pCXh6DLvLeP5E0Q57Qx8h_1yWqSAiiYh0abHw.mp4)

## 核心功能

- 自动生成 HTML 页面
- 多种预设模板
- 响应式布局
- 支持自定义模板开发

## 快速开始

```bash
# 进入展示技能目录
cd display-skill

# 安装依赖
npm install

# 配置展示选项
cp config.example.json config.json
# 编辑 config.json 配置模板和样式

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

| 模板 | 说明 | 适用场景 |
|------|------|----------|
| `premium` | 高端奢华风格 | 头等舱、商务舱展示 |
| `list` | 列表清单风格 | 数据对比展示 |
| `card` | 卡片网格风格 | 多航司对比 |
| `table` | 表格对比风格 | 详细参数对比 |

## 详细文档

- [SKILL.md](SKILL.md) - 展示技能主文档

## 注意事项

1. 需要先执行 `npm install` 安装依赖
2. 可以通过 `config.json` 配置模板和样式
3. 输出页面默认保存在当前目录
