---
name: premium-cabin-collector-skill
description: 用于调取航司高舱信息并生成页面信息展示的开发指南
---

# 航司高舱信息采集与展示

用于调取航司高舱信息并生成页面信息展示的开发指南，涵盖数据采集、处理、页面渲染等完整流程。

## 触发条件

当用户需要以下功能时触发使用：
- 调取航司高舱信息数据
- 生成高舱信息展示页面
- 处理高舱数据采集与格式化
- 开发高舱信息相关的展示组件

## 核心功能

| 功能 | 说明 |
|------|------|
| 数据采集 | 从航司系统或接口获取高舱信息 |
| 数据处理 | 清洗、格式化、结构化高舱数据 |
| 页面生成 | 自动生成高舱信息展示页面 |
| 组件渲染 | 提供可复用的高舱信息展示组件 |

## 快速开始

### 环境准备

```bash
# 安装依赖
npm install

# 配置 API 密钥
cp .env.example .env
# 编辑 .env 填写航司 API 密钥

# 启动开发服务
npm run dev
```

### 常用命令

```bash
# 采集航司数据
npm run collect

# 生成展示页面
npm run generate

# 构建生产包
npm run build

# 部署发布
npm run deploy
```

## 项目结构

```
project/
├── src/
│   ├── collectors/     # 数据采集器
│   ├── processors/     # 数据处理器
│   ├── generators/     # 页面生成器
│   └── components/     # 展示组件
├── config/             # 配置文件
├── templates/          # 页面模板
├── data/               # 采集的数据
└── output/             # 生成的页面
```

## 开发规范

### 命名规范
- 文件命名：使用 kebab-case（短横线连接）
- 变量命名：使用 camelCase
- 常量命名：使用 UPPER_SNAKE_CASE

### 代码风格
- 使用 2 个空格缩进
- 使用单引号
- 行尾不保留分号

## 参考资料

- [详细指南](./references/guide.md)
- [API 文档](./references/api.md)
- [常见问题](./references/faq.md)

## 相关链接

- 航司 API 文档：[链接](#)
- 设计规范：[链接](#)
- 问题反馈：[链接](#)
