#!/usr/bin/env node

/**
 * 航空公司飞机图片分类工具 v2
 * 通用版本 - 支持任意航空公司
 *
 * 分类体系：
 * - 0-原始数据：从航司官网爬取的原始图片
 * - 1-座椅布局：座位图、舱位布局平面图
 * - 2-座椅图片：座椅实物照片（商务舱、经济舱等）
 * - 3-机上餐食：餐食、饮品、菜单图片
 * - 4-娱乐设备：IFE 屏幕、USB 端口、WiFi 等设备
 * - 5-其他信息：logo、图标、外观等其他图片
 *
 * 使用方法:
 * node classify-images-v2.js                          # 使用默认参数
 * node classify-images-v2.js --base-dir /path/to/airline
 * node classify-images-v2.js --airline "国泰航空"
 */

const fs = require('fs');
const path = require('path');

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    baseDir: null,
    airline: null
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base-dir' && args[i + 1]) {
      config.baseDir = args[++i];
    } else if (args[i] === '--airline' && args[i + 1]) {
      config.airline = args[++i];
    }
  }

  return config;
}

const config = parseArgs();

// 基础目录 - 支持命令行参数或默认值
const BASE_DIR = config.baseDir || process.env.FLIGHT_DATA_BASE_DIR || null;

// 自动检测机型目录
function detectAircraftDirs(baseDir) {
  const aircraftDirs = [];

  if (!fs.existsSync(baseDir)) {
    return aircraftDirs;
  }

  const items = fs.readdirSync(baseDir);
  for (const item of items) {
    const itemPath = path.join(baseDir, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      // 检查是否为机型目录（包含 images 子目录）
      const imagesPath = path.join(itemPath, 'images');
      if (fs.existsSync(imagesPath) && fs.statSync(imagesPath).isDirectory()) {
        aircraftDirs.push(item);
      }
    }
  }

  return aircraftDirs;
}

// 从航司名称推断机型目录
function getAirlineDir(baseDir, airlineName) {
  if (!fs.existsSync(baseDir)) {
    return null;
  }

  const items = fs.readdirSync(baseDir);
  for (const item of items) {
    if (item.includes(airlineName)) {
      return path.join(baseDir, item);
    }
  }

  // 尝试匹配航空司代码
  const airlineCodes = {
    '国泰': 'CX',
    '国航': 'CA',
    '南航': 'CZ',
    '东航': 'MU',
    '海航': 'HU'
  };

  for (const [name, code] of Object.entries(airlineCodes)) {
    if (airlineName.includes(name) || airlineName.includes(code)) {
      for (const item of items) {
        if (item.toUpperCase().includes(code)) {
          return path.join(baseDir, item);
        }
      }
    }
  }

  return baseDir; // 返回基础目录本身
}

// 分类体系
const CATEGORIES = [
  { id: '0-原始数据', description: '从航司官网爬取的原始图片' },
  { id: '1-座椅布局', description: '座位图、舱位布局平面图' },
  { id: '2-座椅图片', description: '座椅实物照片（商务舱、经济舱等）' },
  { id: '3-机上餐食', description: '餐食、饮品、菜单图片' },
  { id: '4-娱乐设备', description: 'IFE 屏幕、USB 端口、WiFi 等设备' },
  { id: '5-其他信息', description: 'logo、图标、外观等其他图片' }
];

// 基于图片序号和文件特征的分类规则
function classifyImage(filename, size, ext) {
  const match = filename.match(/^(\d+)-/);
  const index = match ? parseInt(match[1]) : -1;

  // 00-完整页面.png = 5-其他信息
  if (filename.includes('完整页面')) {
    return { category: '5-其他信息', reason: '完整页面截图' };
  }

  // 01-image.png = logo (小文件 PNG)
  if (index === 1 && ext === 'png') {
    return { category: '5-其他信息', reason: '航空公司 logo' };
  }

  // 02-image.svg = 信息图标
  if (index === 2 && ext === 'svg') {
    return { category: '5-其他信息', reason: '信息图标' };
  }

  // 03-image.webp = 座椅布局图（通常是主图，文件较大）
  if (index === 3 && ext === 'webp') {
    return { category: '1-座椅布局', reason: '座椅布局平面图（主图）' };
  }

  // 04-08 SVG = 功能图标
  if (index >= 4 && index <= 8 && ext === 'svg') {
    return { category: '5-其他信息', reason: '功能图标' };
  }

  // 09-12 webp = 座椅图片（小文件，座椅细节特写）
  if (index >= 9 && index <= 12 && ext === 'webp') {
    return { category: '2-座椅图片', reason: '座椅细节图片' };
  }

  // 13-image.webp = 座椅布局图（通常是副图/不同舱位视角）
  if (index === 13 && ext === 'webp') {
    return { category: '1-座椅布局', reason: '座椅布局平面图（副图）' };
  }

  // 14-17 webp: 根据文件大小判断
  // 大文件 (>50KB) = 座椅布局图（俯瞰视角的座位分布）
  // 小文件 = 座椅图片（座椅实物特写）
  if (index >= 14 && index <= 17 && ext === 'webp') {
    if (size > 50000) {
      return { category: '1-座椅布局', reason: '座椅布局平面图（大文件）' };
    }
    return { category: '2-座椅图片', reason: '座椅或舱位图片' };
  }

  // 18-image.webp: 根据文件大小判断
  if (index === 18 && ext === 'webp') {
    if (size > 50000) {
      return { category: '1-座椅布局', reason: '座椅布局平面图' };
    }
    return { category: '2-座椅图片', reason: '座椅实物图片' };
  }

  // 19-22 webp: 根据文件大小判断
  // 大文件 (>50KB) = 座椅布局图（额外舱位视角）
  // 小文件 = 娱乐设备或其他细节
  if (index >= 19 && index <= 22 && ext === 'webp') {
    if (size > 50000) {
      return { category: '1-座椅布局', reason: '座椅布局平面图（大文件）' };
    }
    return { category: '4-娱乐设备', reason: '机上设备图片' };
  }

  // 23+ webp: 根据文件大小判断
  if (index >= 23 && ext === 'webp') {
    if (size > 50000) {
      return { category: '1-座椅布局', reason: '座椅布局平面图（大文件）' };
    }
    return { category: '5-其他信息', reason: '待确认' };
  }

  // 23+ SVG = 图标
  if (index >= 23 && ext === 'svg') {
    return { category: '5-其他信息', reason: '图标' };
  }

  // 默认分类
  return { category: '5-其他信息', reason: '待确认' };
}

function processAircraft(aircraftType, baseDir) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`处理机型：${aircraftType}`);
  console.log('='.repeat(50));

  const sourceDir = path.join(baseDir, aircraftType, 'images', '0-原始数据');

  // 创建所有目标目录
  const targetDirs = CATEGORIES.map(c => path.join(baseDir, aircraftType, 'images', c.id));
  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // 读取源目录
  if (!fs.existsSync(sourceDir)) {
    console.log(`⚠️ 源目录不存在：${sourceDir}`);
    return null;
  }

  const files = fs.readdirSync(sourceDir);
  const images = files.filter(f => /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(f));
  console.log(`找到 ${images.length} 张图片`);

  // 检查分类目录是否为空，如果为空则需要重新分类
  let needReclassify = false;
  for (const cat of CATEGORIES) {
    if (cat.id === '0-原始数据') continue;
    const catDir = path.join(baseDir, aircraftType, 'images', cat.id);
    if (fs.existsSync(catDir) && fs.readdirSync(catDir).length === 0) {
      needReclassify = true;
      break;
    }
  }

  // 如果分类目录为空，重新分类；否则跳过（已有分类）
  if (!needReclassify) {
    console.log('分类目录已有图片，跳过重新分类');
    return null;
  }

  console.log('分类目录为空，开始重新分类...');

  const classification = {};
  for (const cat of CATEGORIES) {
    classification[cat.id] = [];
  }

  // 分类每张图片
  for (const image of images) {
    const imagePath = path.join(sourceDir, image);
    const stats = fs.statSync(imagePath);
    const ext = path.extname(image).toLowerCase().replace('.', '');

    const result = classifyImage(image, stats.size, ext);
    classification[result.category].push({
      original: image,
      reason: result.reason,
      size: stats.size
    });
  }

  // 输出分类结果
  console.log('\n分类结果:');
  for (const cat of CATEGORIES) {
    console.log(`  ${cat.id}: ${classification[cat.id].length} 张`);
  }

  // 复制图片到对应目录
  for (const cat of CATEGORIES) {
    if (cat.id === '0-原始数据') continue;

    const targetDir = path.join(baseDir, aircraftType, 'images', cat.id);
    for (const item of classification[cat.id]) {
      const srcPath = path.join(sourceDir, item.original);
      const dstPath = path.join(targetDir, item.original);
      try {
        fs.copyFileSync(srcPath, dstPath);
      } catch (error) {
        console.error(`复制失败：${item.original} - ${error.message}`);
      }
    }
  }

  // 保存详细报告
  const reportPath = path.join(baseDir, aircraftType, 'images', 'classification-report-v2.md');
  let report = `# ${aircraftType} 图片分类报告 (v2)\n\n`;
  report += `生成时间：${new Date().toLocaleString('zh-CN')}\n\n`;
  report += `## 分类统计\n\n`;
  report += `| 分类 | 图片数量 | 说明 |\n`;
  report += `|------|----------|------|\n`;
  for (const cat of CATEGORIES) {
    report += `| ${cat.id} | ${classification[cat.id].length} | ${cat.description} |\n`;
  }

  report += `\n## 详细文件列表\n\n`;
  for (const cat of CATEGORIES) {
    if (classification[cat.id].length > 0) {
      report += `\n### ${cat.id}\n\n`;
      report += `| 文件名 | 大小 (KB) | 分类理由 |\n`;
      report += `|--------|-----------|----------|\n`;
      for (const item of classification[cat.id]) {
        const sizeKB = (item.size / 1024).toFixed(1);
        report += `| ${item.original} | ${sizeKB} | ${item.reason} |\n`;
      }
    }
  }

  fs.writeFileSync(reportPath, report);
  console.log(`报告已保存：${reportPath}`);

  return classification;
}

function main() {
  let targetDir = BASE_DIR;

  // 如果指定了航司名称，查找对应目录
  if (config.airline) {
    targetDir = getAirlineDir(BASE_DIR || process.cwd(), config.airline);
    console.log('=' .repeat(60));
    console.log(`航空公司飞机图片分类工具 v2`);
    console.log(`航司：${config.airline}`);
  } else {
    console.log('=' .repeat(60));
    console.log(`航空公司飞机图片分类工具 v2`);
  }

  console.log(`工作目录：${targetDir}`);
  console.log('分类体系：0-原始数据，1-座椅布局，2-座椅图片，3-机上餐食，4-娱乐设备，5-其他信息');
  console.log('=' .repeat(60));

  // 自动检测机型目录
  const aircraftDirs = detectAircraftDirs(targetDir);

  if (aircraftDirs.length === 0) {
    console.log('⚠️ 未找到机型目录，请检查目录结构');
    return;
  }

  console.log(`检测到 ${aircraftDirs.length} 个机型：${aircraftDirs.join(', ')}`);

  const results = {};

  for (const aircraft of aircraftDirs) {
    try {
      results[aircraft] = processAircraft(aircraft, targetDir);
    } catch (error) {
      console.error(`处理 ${aircraft} 时出错：${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 所有处理完成!\n');

  // 生成汇总报告
  const summaryPath = path.join(targetDir, '图片分类汇总-v2.md');
  let summary = `# 图片分类汇总 (v2)\n\n`;
  summary += `生成时间：${new Date().toLocaleString('zh-CN')}\n\n`;
  summary += `## 分类体系说明\n\n`;
  summary += `| 编号 | 分类名称 | 说明 |\n`;
  summary += `|------|----------|------|\n`;
  for (const cat of CATEGORIES) {
    summary += `| ${cat.id} | ${cat.description} |\n`;
  }

  summary += `\n## 各机型分类统计\n\n`;
  summary += `| 机型 | 0-原始数据 | 1-座椅布局 | 2-座椅图片 | 3-机上餐食 | 4-娱乐设备 | 5-其他信息 | 总计 |\n`;
  summary += `|------|-------------|-------------|-------------|-------------|-------------|------|\n`;

  for (const [aircraft, classification] of Object.entries(results)) {
    const counts = {};
    let total = 0;
    for (const cat of CATEGORIES) {
      counts[cat.id] = classification ? classification[cat.id].length : 0;
      total += counts[cat.id];
    }
    summary += `| ${aircraft} | ${counts['0-原始数据']} | ${counts['1-座椅布局']} | ${counts['2-座椅图片']} | ${counts['3-机上餐食']} | ${counts['4-娱乐设备']} | ${counts['5-其他信息']} | ${total} |\n`;
  }

  fs.writeFileSync(summaryPath, summary);
  console.log(`汇总报告：${summaryPath}\n`);
}

main();
