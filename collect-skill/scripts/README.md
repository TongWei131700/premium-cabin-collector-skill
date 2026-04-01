# premium-cabin-collector / scripts

本目录为 **Premium Cabin Collector** 技能的脚本集合。

## 核心流程

| 文件 | 用途 |
|------|------|
| `scrape_seatmaps.py` | 从 seatmaps.com 抓取航司或单 URL 机型数据（自动创建 `机型详情.md`） |
| `batch-process.js` | 可选：串联部分步骤的一键流程 |
| `classify-images-v2.js` | 语义分类图片到 `images/1-5` 子目录 |
| `classify-images-v3.js` | 与 v2 并列的替代/升级版本 |
| `dedup-images.js` | 图片去重 |
| `migrate-and-classify-v2.js` | 迁移与分类辅助 |

## 多版本 / 机型整理

| 文件 | 用途 |
|------|------|
| `organize-a330-versions.js` | A330 等多版本目录整理 |
| `organize-a330-versions-v2.js` | 同上迭代版 |
| `organize-emirates-a380-versions.js` | 阿联酋 A380 版本整理 |
| `distribute-a380-images.js` | A380 图片分发 |
| `dedup-emirates-images.js` | 阿联酋相关去重 |

## 其它工具脚本

| 文件 | 用途 |
|------|------|
| `crawl-a330-v2.py` | A330 相关爬取补充 |
| `download-a330-complete.py` | A330 资源下载 |
| `download-a330-images.py` | A330 图片下载 |
| `download-sq-a350-v2-v3-images.py` | 新航 A350 版本图片 |
| `create-a330-detail-doc.py` | 生成机型详情文档 |
| `create-airline-shortcuts.sh` | 为航司目录创建 seatmaps + 官网快捷方式 |
| `fix-emirates-seatmaps.js` | 修复阿联酋航空 seatmap 文件映射 |
| `fix-raw-data-dir.js` | 修复 `0-原始数据` 目录，确保所有分类图片在其中都有副本 |
| `check-raw-data-completeness.js` | 检查 `0-原始数据` 目录完整性 |
| `organize-emirates-all-aircraft.js` | 阿联酋航空全部机型多版本整理 |

## 使用说明

所有脚本均可通过以下方式调用：

```bash
# 设置技能根目录
SKILL_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# 执行脚本
cd "$SKILL_ROOT/scripts"
python scrape_seatmaps.py --airline "航空公司名称" --output ../output/
```

详细使用示例见 [`../references/examples.md`](../references/examples.md)。
