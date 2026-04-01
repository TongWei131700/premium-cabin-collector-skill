# Premium Cabin Collector — 示例

执行前请先阅读 [`SKILL.md`](../SKILL.md) 中的门禁与目标确认；路径与完整命令见 [`reference.md`](reference.md)。

**技能根目录**：`collect-skill/`。示例中 `SKILL_ROOT` 即该路径。

```bash
SKILL_ROOT="${SKILL_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
```

---

## 示例 1：按航司全量抓取（典型）

**用户意图**：抓取「新加坡航空 SQ」全部机型到项目下的 `FlightData/`。

**Phase 1**：确认输出目录与航司名称（中英文一致、与 seatmaps 列表可对应）。

**Phase 3**（摘录）：

```bash
SKILL_ROOT="${SKILL_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
python "$SKILL_ROOT/scripts/scrape_seatmaps.py" \
  --airline "新加坡航空 Singapore Airlines" \
  --output FlightData/
```

**Phase 5～6**：在 `$SKILL_ROOT/scripts` 下对同一航司目录跑分类与去重（见 [reference.md](reference.md)）。

---

## 示例 2：单机型 URL 抓取

**用户意图**：只抓某一个机型页面。

```bash
SKILL_ROOT="${SKILL_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
python "$SKILL_ROOT/scripts/scrape_seatmaps.py" \
  "https://seatmaps.com/zh-CN/airlines/..." \
  --output FlightData/
```

---

## 示例 3：已有原始数据，仅分类 + 去重

**用户意图**：不重爬，只整理 `FlightData/某航司/` 下已存在的图片。

```bash
SKILL_ROOT="${SKILL_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$SKILL_ROOT/scripts"
node classify-images-v2.js --airline "航司名"
node dedup-images.js --airline "航司名"
```

或使用 `--base-dir` 指向航司目录（见 [reference.md](reference.md)）。

---

## 示例 4：流式进度话术（对话中）

```text
[流式进度] 已开始：正在确认范围（Phase 1）
[流式进度] 进行中：已发现 12 个机型，正在抓取第 3/12 个
[流式进度] Phase 3 完成，产出为 FlightData/新加坡航空 SQ/ 下各机型目录
```

---

## 示例 5：Seatmap 显示多类型 → 目录必须与类型数一致

**场景**：seatmaps 上 **Airbus A380** 标明 **「10 类型」**。

**目录预期**（节选）：

```text
FlightData/某航司/Airbus A380/
├── 机型详情.md
├── 版本索引.md
├── V.1/
│   ├── 机型详情.md
│   └── images/
│       ├── 0-原始数据/
│       ├── 1-座椅布局/
│       ├── 2-座椅图片/
│       ├── 3-机上餐食/
│       ├── 4-娱乐设备/
│       └── 5-其他信息/
├── V.2/
│   └── …（同上六项）
└── … 直至 V.10（共 10 个类型目录，与页面「10 类型」一致）
```

**错误示例**：只有 `V.1`～`V.3` 或把 10 套布局混在一个 `images/` 下 — **不允许**。

---

## 示例 6：Seatmap 无餐食 → 回退航司官网

**场景**：某机型 seatmaps 页无餐饮图片/无菜单段落。

**执行顺序**：

1. 完成 seatmaps 该类型（或该机型）其余栏位与图片抓取，并写入对应 `…/images/0-原始数据/`。
2. 打开**当前任务航司官网**，检索机上餐饮、菜单、媒体图库等页面，下载与餐食相关的图文至**同一最深层**的 `images/0-原始数据/`（只追加）。
3. Phase 5 分类时，将餐食相关素材归入 `3-机上餐食/`。
4. 在 `机型详情.md` 或 `版本索引.md` 中注明：餐食素材来源含 **官网**（附 URL 更佳）。

若官网仍无公开餐食资料，在文档中写：**已尝试 seatmaps + 官网，仍无餐食公开内容**。

---

## 示例 7：验收「最深层 images 六项子目录」

**单类型机型**（根即最深层）：

```bash
# 在机型根目录下检查
ls "FlightData/某航司/A321neo/images"
# 必须仅包含：0-原始数据  1-座椅布局  2-座椅图片  3-机上餐食  4-娱乐设备  5-其他信息
```

**多类型机型**（每个 `V.x` 各查一遍）：

```bash
ls "FlightData/某航司/Airbus A380/V.1/images"
ls "FlightData/某航司/Airbus A380/V.2/images"
# ... 依次检查每个版本
```

任一路径缺少六项之一，则验收不通过，须补齐后再 `[Progress] Task finished successfully`。若仅有 `classification-report*.md` 等与六项并列，属允许范围。

---

## 示例 8：Claude Code 下列目录（避免「Shell expansion」弹窗）

**不要**在 Bash 里写（易触发手动批准）：

```bash
for dir in "/path/A/images" "/path/B/images"; do ls -la "$dir"; done
```

**改为**字面量多行（或改用 Glob 工具）：

```bash
ls -la "/path/A/images"
ls -la "/path/B/images"
```

---

## 示例 9：单类型机型 — 必须在根目录创建机型详情.md

**场景**：「Singapore Airlines Airbus A380-800」在 seatmaps 上显示 **「1 类型」**。

**目录预期**：

```text
FlightData/新加坡航空 SQ/Airbus A380-800/
├── 机型详情.md          # 强制：单类型机型的机型详情在根目录
└── images/
    ├── 0-原始数据/
    ├── 1-座椅布局/
    ├── 2-座椅图片/
    ├── 3-机上餐食/
    ├── 4-娱乐设备/
    └── 5-其他信息/
```

**错误示例**：只有 `images/` 和 `classification-report.md`，**没有机型详情.md** — **不允许**。

**修复方式**：从 `images/0-原始数据/原始页面.html` 中提取舱位配置信息，在机型根目录创建 `机型详情.md`。

---

## 示例 10：多类型机型 — 禁止根级 images 目录

**场景**：「Emirates EK」的 4 个机型（A350-900, A380, 777-200Lr, 777-300Er）均为多类型。

**错误示例**：

```text
FlightData/Emirates EK/Airbus A380/
├── images/              # ❌ 错误：多类型机型根级不得保留 images/
│   ├── 0-原始数据/
│   └── ...
├── V.1/
│   └── images/
├── V.2/
│   └── images/
```

**正确结构**：

```text
FlightData/Emirates EK/Airbus A380/
├── 机型详情.md
├── 版本索引.md
├── V.1/
│   ├── 机型详情.md
│   └── images/
├── V.2/
│   ├── 机型详情.md
│   └── images/
```

**修复方式**：删除根级 `images/`（数据已完整存在于各 `V.x/images/` 内）。
