#!/usr/bin/env node

/**
 * 航空公司飞机图片去重工具
 * 检测并删除每个机型目录下的重复图片
 *
 * 使用方法:
 * node dedup-images.js --base-dir /path/to/airline
 * node dedup-images.js --airline "国泰航空"
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

// 计算文件哈希值
function getFileHash(filepath) {
  const content = fs.readFileSync(filepath);
  return crypto.createHash('md5').update(content).digest('hex');
}

// 检测机型目录
function detectAircraftDirs(baseDir) {
  const aircraftDirs = [];
  if (!fs.existsSync(baseDir)) return aircraftDirs;

  const items = fs.readdirSync(baseDir);
  for (const item of items) {
    const itemPath = path.join(baseDir, item);
    const stats = fs.statSync(itemPath);
    if (stats.isDirectory()) {
      const imagesPath = path.join(itemPath, 'images');
      if (fs.existsSync(imagesPath) && fs.statSync(imagesPath).isDirectory()) {
        aircraftDirs.push(item);
      }
    }
  }
  return aircraftDirs;
}

// 获取航司目录
function getAirlineDir(baseDir, airlineName) {
  if (!fs.existsSync(baseDir)) return null;

  const items = fs.readdirSync(baseDir);
  for (const item of items) {
    if (item.includes(airlineName)) {
      return path.join(baseDir, item);
    }
  }

  const airlineCodes = {
    '国泰': 'CX', '国航': 'CA', '南航': 'CZ',
    '东航': 'MU', '海航': 'HU'
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

  return baseDir;
}

// 去重单个机型目录
function deduplicateAircraft(aircraftType, baseDir) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`处理机型：${aircraftType}`);
  console.log('='.repeat(50));

  const imagesDir = path.join(baseDir, aircraftType, 'images');
  if (!fs.existsSync(imagesDir)) {
    console.log('⚠️ images 目录不存在');
    return { found: 0, removed: 0 };
  }

  // 扫描所有分类目录下的图片
  const hashToFile = new Map(); // hash -> 第一个发现的文件路径
  const duplicates = []; // { file, hash, keep }
  let totalFound = 0;
  let totalRemoved = 0;

  // 分类目录优先级：0-原始数据 > 1-座椅布局 > 2-座椅图片 > ...
  const categoryOrder = ['0-原始数据', '1-座椅布局', '2-座椅图片', '3-机上餐食', '4-娱乐设备', '5-其他信息'];

  for (const category of categoryOrder) {
    const categoryDir = path.join(imagesDir, category);
    if (!fs.existsSync(categoryDir)) continue;

    const files = fs.readdirSync(categoryDir)
      .filter(f => /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(f));

    for (const file of files) {
      const filepath = path.join(categoryDir, file);
      try {
        const hash = getFileHash(filepath);
        totalFound++;

        if (hashToFile.has(hash)) {
          // 发现重复
          duplicates.push({
            file: filepath,
            hash: hash,
            category: category,
            original: hashToFile.get(hash)
          });
        } else {
          hashToFile.set(hash, filepath);
        }
      } catch (error) {
        console.error(`读取文件失败：${file} - ${error.message}`);
      }
    }
  }

  // 删除重复文件
  console.log(`\n发现 ${duplicates.length} 张重复图片:`);
  for (const dup of duplicates) {
    const relativeFile = path.relative(baseDir, dup.file);
    const relativeOriginal = path.relative(baseDir, dup.original);
    console.log(`  ${relativeFile}`);
    console.log(`    与 ${relativeOriginal} 重复`);

    try {
      fs.unlinkSync(dup.file);
      console.log(`    ✓ 已删除`);
      totalRemoved++;
    } catch (error) {
      console.error(`    ✗ 删除失败：${error.message}`);
    }
  }

  console.log(`\n总计：发现 ${totalFound} 张图片，删除 ${totalRemoved} 张重复项`);
  return { found: totalFound, removed: totalRemoved };
}

// 生成去重报告
function generateReport(results, targetDir) {
  const reportPath = path.join(targetDir, '图片去重报告.md');
  let report = `# 航空公司飞机图片去重报告\n\n`;
  report += `生成时间：${new Date().toLocaleString('zh-CN')}\n\n`;
  report += `## 处理摘要\n\n`;
  report += `| 机型 | 图片总数 | 重复删除 | 剩余图片 |\n`;
  report += `|------|----------|----------|----------|\n`;

  let grandTotal = 0;
  let grandRemoved = 0;

  for (const [aircraft, stats] of Object.entries(results)) {
    const remaining = stats.found - stats.removed;
    grandTotal += stats.found;
    grandRemoved += stats.removed;
    report += `| ${aircraft} | ${stats.found} | ${stats.removed} | ${remaining} |\n`;
  }

  report += `\n**总计**: ${grandTotal} 张图片，删除 ${grandRemoved} 张重复项，剩余 ${grandTotal - grandRemoved} 张\n`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n报告已保存：${reportPath}`);
}

function main() {
  const config = parseArgs();
  let targetDir = config.baseDir || process.env.FLIGHT_DATA_BASE_DIR;

  if (config.airline) {
    targetDir = getAirlineDir(targetDir || process.cwd(), config.airline);
    console.log('='.repeat(60));
    console.log(`航空公司飞机图片去重工具`);
    console.log(`航司：${config.airline}`);
  } else {
    console.log('='.repeat(60));
    console.log(`航空公司飞机图片去重工具`);
  }

  console.log(`工作目录：${targetDir}`);
  console.log('='.repeat(60));

  const aircraftDirs = detectAircraftDirs(targetDir);
  if (aircraftDirs.length === 0) {
    console.log('⚠️ 未找到机型目录');
    return;
  }

  console.log(`检测到 ${aircraftDirs.length} 个机型：${aircraftDirs.join(', ')}`);

  const results = {};
  for (const aircraft of aircraftDirs) {
    try {
      results[aircraft] = deduplicateAircraft(aircraft, targetDir);
    } catch (error) {
      console.error(`处理 ${aircraft} 时出错：${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 去重完成!');

  generateReport(results, targetDir);
}

main();
