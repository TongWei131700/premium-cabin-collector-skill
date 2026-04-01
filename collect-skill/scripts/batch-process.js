#!/usr/bin/env node

/**
 * 航空公司数据批量处理脚本
 * 完整工作流：爬取数据 → 下载图片 → 自动分类 → 生成报告
 *
 * 使用方法:
 * node batch-process.js --airline "国泰航空" --output FlightData/
 * node batch-process.js --airline "中国国航" --output FlightData/
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 配置
const SCRIPT_DIR = __dirname;
const BASE_DIR = process.argv.includes('--output')
  ? path.resolve(process.argv[process.argv.indexOf('--output') + 1])
  : path.join(process.cwd(), 'FlightData');

const AIRLINE_NAME = process.argv.includes('--airline')
  ? process.argv[process.argv.indexOf('--airline') + 1]
  : null;

if (!AIRLINE_NAME) {
  console.error('用法：node batch-process.js --airline "航空公司名称" --output FlightData/');
  process.exit(1);
}

console.log('='.repeat(60));
console.log('航空公司数据批量处理工具');
console.log('='.repeat(60));
console.log(`航空公司：${AIRLINE_NAME}`);
console.log(`输出目录：${BASE_DIR}`);
console.log('='.repeat(60));

// 步骤 1: 运行爬取脚本
function runScraper() {
  console.log('\n[步骤 1/3] 爬取航空公司数据...');

  const scraperPath = path.join(SCRIPT_DIR, 'scrape_seatmaps.py');
  const command = `python "${scraperPath}" --airline "${AIRLINE_NAME}" --output "${BASE_DIR}"`;

  try {
    execSync(command, { stdio: 'inherit' });
    console.log('✅ 数据爬取完成');
    return true;
  } catch (error) {
    console.error('❌ 数据爬取失败:', error.message);
    return false;
  }
}

// 步骤 2: 运行分类脚本
function runClassifier() {
  console.log('\n[步骤 2/3] 自动分类图片...');

  // 查找航空公司目录
  const airlineDirs = fs.readdirSync(BASE_DIR)
    .filter(dir => dir.includes(AIRLINE_NAME) || dir.toUpperCase().includes(getAirlineCode(AIRLINE_NAME)));

  if (airlineDirs.length === 0) {
    console.error('❌ 未找到航空公司目录');
    return false;
  }

  const airlineDir = path.join(BASE_DIR, airlineDirs[0]);
  console.log(`处理目录：${airlineDir}`);

  const classifierPath = path.join(SCRIPT_DIR, 'classify-images-v2.js');
  const command = `node "${classifierPath}" --base-dir "${airlineDir}"`;

  try {
    execSync(command, { stdio: 'inherit', cwd: airlineDir });
    console.log('✅ 图片分类完成');
    return true;
  } catch (error) {
    console.error('❌ 图片分类失败:', error.message);
    return false;
  }
}

// 步骤 3: 生成汇总报告
function generateSummary() {
  console.log('\n[步骤 3/3] 生成汇总报告...');

  // 查找所有分类报告
  const airlineDirs = fs.readdirSync(BASE_DIR)
    .filter(dir => dir.includes(AIRLINE_NAME) || dir.toUpperCase().includes(getAirlineCode(AIRLINE_NAME)));

  if (airlineDirs.length === 0) {
    console.error('❌ 未找到航空公司目录');
    return false;
  }

  const airlineDir = path.join(BASE_DIR, airlineDirs[0]);

  // 读取所有机型的分类报告
  const aircraftDirs = fs.readdirSync(airlineDir)
    .filter(dir => fs.statSync(path.join(airlineDir, dir)).isDirectory());

  let summary = `# ${AIRLINE_NAME} 数据处理汇总报告\n\n`;
  summary += `生成时间：${new Date().toLocaleString('zh-CN')}\n\n`;
  summary += `## 处理结果\n\n`;
  summary += `| 机型 | 原始图片 | 座椅布局 | 座椅图片 | 餐食 | 娱乐设备 | 其他 |\n`;
  summary += `|------|----------|----------|----------|------|----------|------|\n`;

  for (const aircraft of aircraftDirs) {
    const reportPath = path.join(airlineDir, aircraft, 'images', 'classification-report-v2.md');
    if (fs.existsSync(reportPath)) {
      const content = fs.readFileSync(reportPath, 'utf-8');
      const matches = content.match(/\| (\d+-[^|]+) \| (\d+) \|/g);
      if (matches) {
        summary += `| ${aircraft} | `;
        for (const match of matches) {
          const count = match.match(/\| (\d+) \|$/)?.[1] || '0';
          summary += `${count} | `;
        }
        summary += '\n';
      }
    }
  }

  const summaryPath = path.join(airlineDir, '数据处理汇总.md');
  fs.writeFileSync(summaryPath, summary);
  console.log(`汇总报告：${summaryPath}`);
  console.log('✅ 汇总报告生成完成');
  return true;
}

// 辅助函数：获取航空公司代码
function getAirlineCode(airlineName) {
  const codes = {
    '国泰航空': 'CX',
    '中国国航': 'CA',
    '南方航空': 'CZ',
    '东方航空': 'MU',
    '海南航空': 'HU',
    '厦门航空': 'MF',
    '四川航空': '3U'
  };
  return codes[airlineName] || '';
}

// 主流程
async function main() {
  const startTime = Date.now();

  console.log(`\n开始处理：${AIRLINE_NAME}`);
  console.log('-'.repeat(60));

  // 步骤 1: 爬取数据
  const scrapeSuccess = runScraper();

  // 步骤 2: 分类图片
  const classifySuccess = scrapeSuccess ? runClassifier() : false;

  // 步骤 3: 生成报告
  const summarySuccess = classifySuccess ? generateSummary() : false;

  // 总结
  console.log('\n' + '='.repeat(60));
  console.log('处理完成');
  console.log('='.repeat(60));
  console.log(`总耗时：${((Date.now() - startTime) / 1000).toFixed(1)} 秒`);
  console.log('='.repeat(60));

  if (summarySuccess) {
    console.log('✅ 所有步骤完成');
  } else {
    console.log('⚠️ 部分步骤失败，请检查日志');
  }
}

// 运行
main().catch(console.error);
