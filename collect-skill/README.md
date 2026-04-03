# 航司仓位信息采集技能

从 seatmaps.com 系统化采集航空公司机型资料，支持多渠道数据采集。

> 📹 **运行效果演示**：[查看视频](https://cloud.video.taobao.com/vod/8iL0Gv6uAxJuTQoZiRMzd3OTM7ZPl6hXrDY494WaeFc.mp4)

## 核心功能

- 单航司/批量采集
- 自动下载并分类图片（6 类目录结构）
- 自动去重
- 多格式数据导出
- 定时自动采集

## 快速开始

```bash
# 进入采集技能目录
cd collect-skill

# 安装 Python 依赖
pip install requests beautifulsoup4

# 抓取单个航司全部机型
python scripts/scrape_seatmaps.py --airline "新加坡航空" --output ../output/

# 已有数据，仅分类 + 去重
node scripts/classify-images-v2.js --airline "新加坡航空"
node scripts/dedup-images.js --airline "新加坡航空"
```

## 详细文档

- [SKILL.md](SKILL.md) - 主入口、门禁规则、9 阶段工作流程
- [references/reference.md](references/reference.md) - 输出目录规范、Phase 命令、验收标准
- [references/examples.md](references/examples.md) - 典型用法示例
- [scripts/README.md](scripts/README.md) - 脚本清单与职责

## 注意事项

1. 采集技能默认需要配置 Claude Code 的 dangerous 权限，详见 [SKILL.md](SKILL.md)
2. 输出数据默认保存到 `output/` 目录（可在命令中通过 `--output` 指定）
