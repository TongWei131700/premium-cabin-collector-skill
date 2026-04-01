#!/usr/bin/env python3
"""
Flight Data Collector - Seatmaps Scraper

从 seatmaps.com 抓取航空公司座位图数据并整理为结构化文档。

用法:
    # 抓取单个机型
    python scrape_seatmaps.py <url> --output <output_dir>

    # 抓取整个航空公司 (自动发现所有机型)
    python scrape_seatmaps.py --airline "国泰航空" --output <output_dir>

    python scrape_seatmaps.py --help

示例:
    python scrape_seatmaps.py "https://seatmaps.com/zh-CN/airlines/cx-cathay-pacific/boeing-777-300/" --output FlightData/
    python scrape_seatmaps.py --airline "Cathay Pacific" --output FlightData/
"""

import os
import re
import sys
import json
import shutil
import hashlib
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import argparse

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("❌ 需要安装依赖：pip install requests beautifulsoup4")
    sys.exit(1)


def parse_args():
    parser = argparse.ArgumentParser(description='抓取 seatmaps.com 航空公司座位图数据')
    parser.add_argument('url', nargs='?', help='seatmaps.com 网址 (单个机型)')
    parser.add_argument('--output', '-o', default='FlightData', help='输出目录 (默认：FlightData)')
    parser.add_argument('--airline', '-a', help='航空公司名称 (自动发现所有机型并批量抓取)')
    parser.add_argument('--dry-run', action='store_true', help='仅预览，不下载')
    parser.add_argument('--limit', '-l', type=int, help='限制抓取机型数量 (默认：全部)')
    return parser.parse_args()


def airline_name_to_slug(name):
    """将航空公司名称转换为 URL slug"""
    # 常见航空公司映射
    airline_map = {
        '国泰': 'cx-cathay-pacific',
        '国泰航空': 'cx-cathay-pacific',
        'cathay': 'cx-cathay-pacific',
        'cathay pacific': 'cx-cathay-pacific',
        '国航': 'ca-air-china',
        '中国国际航空': 'ca-air-china',
        'air china': 'ca-air-china',
        '东航': 'mu-china-eastern',
        '东方航空': 'mu-china-eastern',
        'china eastern': 'mu-china-eastern',
        '南航': 'cz-china-southern',
        '南方航空': 'cz-china-southern',
        'china southern': 'cz-china-southern',
        '新航': 'sq-singapore-airlines',
        '新加坡航空': 'sq-singapore-airlines',
        'singapore airlines': 'sq-singapore-airlines',
        '阿联酋航空': 'ek-emirates',
        'emirates': 'ek-emirates',
        '汉莎': 'lh-lufthansa',
        'lufthansa': 'lh-lufthansa',
        '美联航': 'ua-united-airlines',
        'united': 'ua-united-airlines',
        '达美': 'dl-delta',
        'delta': 'dl-delta',
        '全日空': 'nh-ana',
        'ana': 'nh-ana',
        '日航': 'jl-jal',
        'jal': 'jl-jal',
        '日本航空': 'jl-jal',
        '法航': 'af-air-france',
        'air france': 'af-air-france',
        '英航': 'ba-british-airways',
        'british airways': 'ba-british-airways',
        '荷兰皇家': 'kl-klm',
        'klm': 'kl-klm',
    }

    name_lower = name.lower().strip()
    # 直接匹配
    if name_lower in airline_map:
        return airline_map[name_lower]

    # 模糊匹配
    for key in airline_map:
        if key in name_lower or name_lower in key:
            return airline_map[key]

    # 默认：转换为 slug
    slug = name.lower().replace(' ', '-').replace('航空', '').replace('airlines', '')
    return slug


def extract_airline_info(url):
    """从 URL 提取航空公司和机型信息"""
    # https://seatmaps.com/zh-CN/airlines/cx-cathay-pacific/boeing-777-300/
    match = re.search(r'/airlines/([^/]+)/([^/]+)', url)
    if match:
        code_name = match.group(1)  # cx-cathay-pacific
        aircraft = match.group(2)   # boeing-777-300

        # 提取代码和名称
        parts = code_name.split('-')
        if len(parts) >= 2:
            code = parts[0].upper()
            name = '-'.join(parts[1:]).replace('-', ' ').title()
        else:
            code = code_name.upper()
            name = code_name.replace('-', ' ').title()

        # 机型名称格式化 - 保留连字符
        # boeing-777-300 → Boeing 777-300
        aircraft_name = aircraft.replace('-', ' ').title()
        # 重新添加连字符：Boeing 777 300 → Boeing 777-300
        aircraft_name = re.sub(r'(\d+) (\d+)', r'\1-\2', aircraft_name)

        return {
            'code': code,
            'name': name,
            'aircraft': aircraft_name,
            'dir_name': f"{name} {code}"
        }
    return None


def discover_aircraft_models(airline_slug):
    """发现航空公司的所有机型"""
    base_url = f"https://seatmaps.com/zh-CN/airlines/{airline_slug}/"
    print(f"🔍 发现机型：{base_url}")

    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }

    try:
        response = requests.get(base_url, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"⚠️  无法访问航司主页：{e}")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')

    aircraft_list = []

    # 查找所有机型链接
    # 常见模式：链接包含 /airlines/{slug}/{aircraft}/
    pattern = re.compile(rf'/zh-CN/airlines/{re.escape(airline_slug)}/([^/]+)/')

    for link in soup.find_all('a', href=True):
        href = link['href']
        match = pattern.search(href)
        if match:
            aircraft_slug = match.group(1)
            aircraft_name = aircraft_slug.replace('-', ' ').title()
            aircraft_url = f"https://seatmaps.com/zh-CN/airlines/{airline_slug}/{aircraft_slug}/"

            if aircraft_url not in [a['url'] for a in aircraft_list]:
                aircraft_list.append({
                    'slug': aircraft_slug,
                    'name': aircraft_name,
                    'url': aircraft_url
                })

    # 如果没有找到，尝试查找页面上的机型列表
    if not aircraft_list:
        # 查找包含机型名称的元素
        for elem in soup.find_all(['h2', 'h3', 'a']):
            text = elem.get_text(strip=True)
            if re.search(r'(boeing|airbus|embraer|bombardier|comac|737|747|757|767|777|787|a320|a330|a340|a350|a380)', text, re.I):
                # 尝试构造 URL
                slug = text.lower().replace(' ', '-').replace('®', '').replace('™', '')
                slug = re.sub(r'[^a-z0-9-]', '', slug)
                aircraft_url = f"https://seatmaps.com/zh-CN/airlines/{airline_slug}/{slug}/"

                aircraft_list.append({
                    'slug': slug,
                    'name': text,
                    'url': aircraft_url
                })

    print(f"✅ 发现 {len(aircraft_list)} 个机型")
    for ac in aircraft_list:
        print(f"   - {ac['name']}")

    return aircraft_list


def download_image(url, output_path):
    """下载图片"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        with open(output_path, 'wb') as f:
            f.write(response.content)

        size = os.path.getsize(output_path)
        return True, size
    except Exception as e:
        return False, str(e)


def classify_image(url, filename):
    """根据 URL 路径和文件名分类图片"""
    url_lower = url.lower()
    filename_lower = filename.lower()

    # 根据 URL 路径分类（优先级最高）
    if '/img/screenshots/seatmaps/' in url_lower:
        return '1-座椅布局'  # 座位图

    # PNG 文件通常是座位图
    if filename.endswith('.png'):
        return '1-座椅布局'

    # 根据文件名关键词分类
    if any(kw in filename_lower for kw in ['seat', 'business', 'economy', 'first', 'suite']):
        return '2-座椅图片'
    elif any(kw in filename_lower for kw in ['food', 'meal', 'dining']):
        return '3-机上餐食'
    elif any(kw in filename_lower for kw in ['entertainment', 'screen', 'ife']):
        return '4-娱乐设备'
    elif any(kw in filename_lower for kw in ['logo', 'exterior']):
        return '5-其他信息'

    # 默认分类
    return '0-原始数据'


def download_images_to_categories(images, images_dir):
    """下载图片并分类到不同子目录"""
    categories = ['0-原始数据', '1-座椅布局', '2-座椅图片', '3-机上餐食', '4-娱乐设备', '5-其他信息']

    # 创建分类目录
    for cat in categories:
        (images_dir / cat).mkdir(parents=True, exist_ok=True)

    downloaded = 0
    failed = 0

    for url in images:
        filename = url.split('/')[-1]
        # 清理文件名
        filename = re.sub(r'[?#].*$', '', filename)  # 移除查询参数和片段

        category = classify_image(url, filename)
        save_path = images_dir / category / filename

        success, _ = download_image(url, save_path)
        if success:
            downloaded += 1
        else:
            failed += 1

    print(f"   ✅ 下载完成：{downloaded} 张成功，{failed} 张失败")


def scrape_seatmaps(url, dry_run=False):
    """抓取 seatmaps.com 页面"""
    print(f"📥 抓取：{url}")

    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }

    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()

    # 保存原始 HTML
    raw_html = response.text

    soup = BeautifulSoup(response.text, 'html.parser')

    data = {
        'url': url,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M GMT+8'),
        'images': [],
        'raw_html': raw_html
    }

    # 提取基本信息
    # 需要根据实际页面结构调整选择器
    title = soup.find('h1')
    if title:
        data['title'] = title.get_text(strip=True)

    # 提取表格数据
    tables = soup.find_all('table')
    for table in tables:
        rows = table.find_all('tr')
        for row in rows:
            cells = row.find_all(['td', 'th'])
            if len(cells) >= 2:
                key = cells[0].get_text(strip=True)
                value = cells[1].get_text(strip=True)
                data[key] = value

    # 提取图片 - 直接从 img 标签提取
    img_elements = soup.find_all('img', src=True)
    hash_ids_seen = set()

    for img in img_elements:
        src = img.get('src', '')
        if not src:
            continue

        # 处理相对路径
        if src.startswith('/'):
            src = f'https://seatmaps.com{src}'

        # 只收集 seatmaps.com 的图片
        if 'seatmaps.com' not in src:
            continue

        # 跳过 logo 和 rating 图片
        if any(skip in src for skip in ['/logo/', '/ratings/', 'icon-', '.svg']):
            continue

        # 提取 hash_id (从 URL 中获取 32 位 hex 字符串)
        hash_match = re.search(r'/([a-f0-9]{32})', src)
        hash_id = hash_match.group(1) if hash_match else None

        if hash_id and hash_id not in hash_ids_seen:
            hash_ids_seen.add(hash_id)
            # 座位图 URL
            seatmap_url = f'https://seatmaps.com/img/screenshots/seatmaps/{hash_id}.webp'
            if seatmap_url not in data['images']:
                data['images'].append(seatmap_url)

            # 客舱图片目录
            photo_dir_url = f'https://seatmaps.com/assets/photo-planes/{hash_id}/'
            try:
                photo_response = requests.get(photo_dir_url, headers=headers, timeout=10)
                if photo_response.status_code == 200:
                    photo_matches = re.findall(r'href="([^"]+\.(webp|jpg|png))"', photo_response.text)
                    for photo_filename, _ in photo_matches:
                        if photo_filename.startswith(hash_id):
                            full_url = f'{photo_dir_url}{photo_filename}'
                            if full_url not in data['images']:
                                data['images'].append(full_url)
            except:
                pass

        # 直接添加符合条件的图片 URL
        if 'photo-planes' in src and src not in data['images']:
            data['images'].append(src)

    # 提取评分
    rating_elem = soup.find(class_=re.compile(r'rating|score|star', re.I))
    if rating_elem:
        data['rating'] = rating_elem.get_text(strip=True)

    # 提取用户评论
    reviews = soup.find_all(class_=re.compile(r'review|comment|feedback', re.I))
    data['reviews'] = [r.get_text(strip=True) for r in reviews[:5]]

    return data


def generate_aircraft_detail_md(data, airline_info, is_single_type=True, version=None):
    """生成机型详情.md（单类型在根目录，多类型在 V.x 目录）"""
    if is_single_type:
        title = f"{airline_info['name']} {airline_info['aircraft']} 机型详情"
    else:
        title = f"{airline_info['name']} {airline_info['aircraft']} {version} 机型详情"

    md = f"""# {title}

> 数据来源：seatmaps.com | 最后更新：{datetime.now().strftime('%Y-%m-%d')}

---

## 📊 基本信息

| 项目 | 详情 |
|------|------|
| **航空公司** | {airline_info['name']} ({airline_info['code']}) |
| **机型** | {airline_info['aircraft']} |
"""

    if version:
        md += f"| **版本** | {version} |\n"
    else:
        md += "| **版本** | 单类型（1 类型） |\n"

    md += f"""| **总座位数** | {data.get('总座位数', '待确认')} |
| **舱位配置** | {data.get('舱位配置', '待确认')} |

---

## 🛋️ 舱位详情

### 头等舱 / 套房 (First Class / Suites)

| 参数 | 数值 |
|------|------|
| 座位数 | 待补充 |
| 腿部空间 | 待补充 |
| 座椅宽度 | 待补充 |

---
### 商务舱 (Business Class)

| 参数 | 数值 |
|------|------|
| 座位数 | 待补充 |
| 腿部空间 | 待补充 |
| 座椅宽度 | 待补充 |

---
### 优选经济舱 (Premium Economy)

| 参数 | 数值 |
|------|------|
| 座位数 | 待补充 |
| 腿部空间 | 待补充 |
| 座椅宽度 | 待补充 |

---
### 经济舱 (Economy Class)

| 参数 | 数值 |
|------|------|
| 座位数 | 待补充 |
| 腿部空间 | 待补充 |
| 座椅宽度 | 待补充 |

---

## 📝 备注

- 座位配置数据待从 seatmaps.com 原始数据中提取并补充
- 详细设施信息待补充

---

## 🔗 参考链接

- [seatmaps.com - {airline_info['name']} {airline_info['aircraft']}]({data['url']})
"""

    return md


def generate_markdown(data, airline_info):
    """生成 Markdown 文档"""
    md = f"""# {airline_info['name']} {airline_info['aircraft']} 座位图 - 完整内容整理

**抓取时间**: {data['timestamp']}
**来源网址**: {data['url']}

---

## 📋 基本信息

| 项目 | 详情 |
|------|------|
| **航空公司** | {airline_info['name']} ({airline_info['code']}) |
| **机型** | {airline_info['aircraft']} |
| **总座位数** | {data.get('总座位数', '待补充')} |
| **舱位配置** | {data.get('舱位配置', '待补充')} |

---

## 🛋️ 舱位详情

### 商务舱 (Business Class)

| 参数 | 数值 |
|------|------|
| 座位数 | {data.get('商务舱座位数', '待补充')} |
| 腿部空间 | {data.get('商务舱腿部空间', '待补充')} |
| 座椅宽度 | {data.get('商务舱座椅宽度', '待补充')} |

### 经济舱 (Economy Class)

| 参数 | 数值 |
|------|------|
| 座位数 | {data.get('经济舱座位数', '待补充')} |
| 腿部空间 | {data.get('经济舱腿部空间', '待补充')} |
| 座椅宽度 | {data.get('经济舱座椅宽度', '待补充')} |

---

## ⭐ 用户评分

{data.get('rating', '暂无评分')}

---

## 🖼️ 已下载图片

"""

    for img_url in data.get('images', [])[:10]:
        filename = hashlib.md5(img_url.encode()).hexdigest()[:16]
        ext = os.path.splitext(urlparse(img_url).path)[1] or '.webp'
        md += f"- `{filename}{ext}`\n"

    return md


def generate_airline_index(output_dir, airline_name_cn):
    """生成航司机型索引"""
    # 构建航司目录名
    # 先查找第一个航司目录
    airline_dir = None
    for item in output_dir.iterdir():
        if item.is_dir() and airline_name_cn in item.name:
            airline_dir = item
            break

    if not airline_dir:
        print(f"⚠️  未找到航司目录")
        return None

    # 读取文档提取信息
    index_content = f"# {airline_dir.name} - 机型索引\n\n"
    index_content += "| 机型 | 文档 | 抓取时间 |\n"
    index_content += "|------|------|----------|\n"

    for item in sorted(airline_dir.iterdir()):
        if item.is_dir():
            md_file = item / '完整内容整理.md'
            if md_file.exists():
                # 提取机型名称
                aircraft_name = item.name
                # 提取抓取时间
                with open(md_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    time_match = re.search(r'\*\*抓取时间\*\*: (.+?)\n', content)
                    time_str = time_match.group(1) if time_match else '未知'

                rel_path = f"{item.name}/完整内容整理.md"
                index_content += f"| {aircraft_name} | [查看]({rel_path}) | {time_str} |\n"

    index_path = airline_dir / "INDEX.md"
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(index_content)

    print(f"📑 索引已生成：{index_path}")
    return index_path


def scrape_single_aircraft(url, output_dir, airline_name_cn=None, dry_run=False):
    """抓取单个机型（单类型）"""
    airline_info = extract_airline_info(url)
    if not airline_info:
        print(f"⚠️  无法解析 URL: {url}")
        return False

    # 使用中文航空公司名称（如果提供）
    if airline_name_cn:
        airline_info['dir_name'] = f"{airline_name_cn} {airline_info['code']}"

    print(f"\n✈️  抓取：{airline_info['name']} - {airline_info['aircraft']}")

    # 航司目录：国泰航空 CX
    airline_dir = output_dir / airline_info['dir_name']
    # 机型目录：Boeing 777-300（单类型在根目录）
    aircraft_subdir = airline_dir / airline_info['aircraft']
    images_dir = aircraft_subdir / 'images'

    if dry_run:
        print(f"   📁 输出：{aircraft_subdir}")
        return True

    airline_dir.mkdir(parents=True, exist_ok=True)
    aircraft_subdir.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(parents=True, exist_ok=True)

    # 抓取数据
    data = scrape_seatmaps(url)

    # 下载图片
    if data.get('images'):
        print(f"   📸 正在下载 {len(data['images'])} 张图片...")
        download_images_to_categories(data['images'], images_dir)

    # 保存原始 HTML 页面（用于后续提取数据）
    html_path = images_dir / '0-原始数据' / '原始页面.html'
    html_path.parent.mkdir(parents=True, exist_ok=True)
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(data.get('raw_html', ''))

    # 生成机型详情.md（单类型在根目录 - 强制要求）
    detail_md = generate_aircraft_detail_md(data, airline_info, is_single_type=True, version=None)
    detail_md_path = aircraft_subdir / '机型详情.md'

    with open(detail_md_path, 'w', encoding='utf-8') as f:
        f.write(detail_md)

    print(f"   ✅ 机型详情已保存：{aircraft_subdir}/机型详情.md")

    # 生成完整内容整理.md（保留向后兼容）
    md_content = generate_markdown(data, airline_info)
    md_path = aircraft_subdir / '完整内容整理.md'

    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)

    print(f"   ✅ 文档已保存：{aircraft_subdir}/完整内容整理.md")
    return True


def main():
    args = parse_args()

    output_dir = Path(args.output)

    # 模式 1: 指定航空公司名称，批量抓取所有机型
    if args.airline:
        airline_name = args.airline
        print(f"🔍 解析航空公司名称：{airline_name}")

        airline_slug = airline_name_to_slug(airline_name)
        print(f"✈️  航空公司 Slug: {airline_slug}")

        # 发现所有机型
        aircraft_list = discover_aircraft_models(airline_slug)

        if not aircraft_list:
            print("❌ 未发现任何机型")
            sys.exit(1)

        # 限制数量
        if args.limit:
            aircraft_list = aircraft_list[:args.limit]
            print(f"📌 限制抓取 {args.limit} 个机型")

        if args.dry_run:
            print(f"\n📁 输出目录：{output_dir}")
            print("🔍 预览模式，不下载")
            for ac in aircraft_list:
                print(f"   - {ac['name']}: {ac['url']}")
            return

        # 批量抓取
        print(f"\n🚀 开始批量抓取 {len(aircraft_list)} 个机型...")
        success_count = 0
        for i, aircraft in enumerate(aircraft_list, 1):
            print(f"\n[{i}/{len(aircraft_list)}] {aircraft['name']}")
            try:
                if scrape_single_aircraft(aircraft['url'], output_dir, airline_name_cn=airline_name, dry_run=args.dry_run):
                    success_count += 1
            except Exception as e:
                print(f"   ❌ 抓取失败：{e}")

        print(f"\n✅ 完成！成功 {success_count}/{len(aircraft_list)} 个机型")

        # 生成索引
        if success_count > 0:
            generate_airline_index(output_dir, airline_name)

        print(f"📁 输出目录：{output_dir}")
        return

    # 模式 2: 指定单个 URL
    if args.url:
        # 从 URL 中提取航空公司名称（用于目录命名）
        airline_info = extract_airline_info(args.url)
        airline_name_cn = None
        if airline_info:
            # 从 URL 中提取 slug
            url_match = re.search(r'/airlines/([^/]+)/', args.url)
            slug = url_match.group(1) if url_match else None

            # 如果是已知的航司，使用中文名称
            slug_to_cn = {
                'cx-cathay-pacific': '国泰航空',
                'ca-air-china': '中国国际航空',
                'cz-china-southern': '中国南方航空',
                'mu-china-eastern': '中国东方航空',
                'hu-hainan-airlines': '海南航空',
            }
            airline_name_cn = slug_to_cn.get(slug)

        if scrape_single_aircraft(args.url, output_dir, airline_name_cn=airline_name_cn, dry_run=args.dry_run):
            print(f"\n✅ 抓取完成")
            print(f"📁 输出目录：{output_dir}")
        else:
            sys.exit(1)
        return

    # 都没有提供
    print("❌ 请提供航空公司名称或 URL")
    print("用法:")
    print("  python scrape_seatmaps.py --airline '国泰航空' --output FlightData/")
    print("  python scrape_seatmaps.py <url> --output FlightData/")
    sys.exit(1)


if __name__ == '__main__':
    main()
