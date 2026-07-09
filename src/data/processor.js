// 数据处理和聚合逻辑
import { parseRangeData, cellsToArray, findHeaderRow, parseHeaders, parseDataRows } from '../api/wps.js';

// 产品线映射
const PRODUCT_LINES = ['箱变', '成套开关', '装备电控', '自动化'];

// 项目阶段定义
const PROJECT_STAGES = [
  '技术提资', '技术设计', '物料采购', '生产在制', 
  '安装调试', '入库发货', '项目暂停', '取消', '预测'
];

// 加载所有sheet数据
export async function loadAllData() {
  const sheets = {};
  const sheetIds = [2, 13, 1, 11, 5, 15];
  
  for (const id of sheetIds) {
    try {
      const response = await fetch(`/data/sheet_${id}.json`);
      const data = await response.json();
      sheets[id] = parseRangeData(data.rangeData);
    } catch (e) {
      console.error(`Failed to load sheet ${id}:`, e);
    }
  }
  
  return sheets;
}

// ==================== 概览数据 ====================

// 从"测试箱变"sheet提取项目数据
export function extractProjects(sheet15) {
  const headerRow = 2; // 第3行是表头
  const rows = [];
  const rowIndices = Object.keys(sheet15).map(Number).sort((a, b) => a - b);
  
  for (const r of rowIndices) {
    if (r < 4) continue; // 跳过标题和表头
    const rowData = sheet15[r];
    if (!rowData) continue;
    
    const projectName = (rowData[6] || '').trim();
    if (!projectName) continue;
    
    const project = {
      seq: rowData[0] || '',
      isKey: rowData[1] || '',
      platform: rowData[2] || '',
      hasCustomParts: rowData[3] || '',
      isTrial: rowData[4] || '',
      workOrder: rowData[5] || '',
      name: projectName,
      stage: (rowData[7] || '').trim(),
      productType: (rowData[8] || '').trim(),
      productName: (rowData[9] || '').trim(),
      projectManager: (rowData[10] || '').trim(),
      quantity: rowData[11] || '',
      deliveryDate: rowData[12] || '',
      plannedDate: rowData[13] || '',
      pm: (rowData[14] || '').trim(),
      completed: rowData[15] || '',
      _rowIndex: r,
    };
    rows.push(project);
  }
  
  return rows;
}

// 从"项目节点完成情况"提取产供销数据
export function extractProductionData(sheet2) {
  const rows = [];
  const rowIndices = Object.keys(sheet2).map(Number).sort((a, b) => a - b);
  
  for (const r of rowIndices) {
    if (r < 4) continue; // 跳过标题
    const rowData = sheet2[r];
    if (!rowData) continue;
    
    const productLine = (rowData[0] || '').trim();
    if (!productLine || productLine === '累计') continue;
    
    const item = {
      productLine: productLine,
      productType: (rowData[1] || '').trim(),
      monthlyPlan: rowData[3] || '',
      monthlySales: rowData[5] || '',
      monthlyAmount: rowData[6] || '',
      completed: rowData[7] || '',
      completionRate: rowData[8] || '',
      week1Plan: rowData[10] || '',
      week1Done: rowData[11] || '',
      week2Plan: rowData[12] || '',
      week2Done: rowData[13] || '',
      week3Plan: rowData[14] || '',
      week3Done: rowData[15] || '',
      week4Plan: rowData[16] || '',
      week4Done: rowData[17] || '',
      exception: rowData[18] || '',
    };
    rows.push(item);
  }
  
  return rows;
}

// 从"项目异常台账"提取异常数据
export function extractExceptions(sheet11) {
  const rows = [];
  const rowIndices = Object.keys(sheet11).map(Number).sort((a, b) => a - b);
  
  for (const r of rowIndices) {
    if (r < 2) continue; // 跳过标题和表头
    const rowData = sheet11[r];
    if (!rowData) continue;
    
    const projectName = (rowData[0] || '').trim();
    if (!projectName) continue;
    
    const exception = {
      projectName: projectName,
      productType: (rowData[1] || '').trim(),
      pm: (rowData[2] || '').trim(),
      contractQty: rowData[3] || '',
      deliveryDate: rowData[4] || '',
      exceptionStage: (rowData[5] || '').trim(),
      plannedClose: rowData[6] || '',
      exceptionTime: rowData[7] || '',
      description: rowData[8] || '',
      solution: rowData[9] || '',
      requiredClose: rowData[10] || '',
      delayDays: rowData[11] || '',
      level: (rowData[12] || '').trim(),
      responsible: (rowData[13] || '').trim(),
      progress: rowData[14] || '',
      _rowIndex: r,
    };
    rows.push(exception);
  }
  
  return rows;
}

// 从"试制计划及进展"提取试制数据
export function extractTrialData(sheet13) {
  const rows = [];
  const rowIndices = Object.keys(sheet13).map(Number).sort((a, b) => a - b);
  
  for (const r of rowIndices) {
    if (r < 4) continue;
    const rowData = sheet13[r];
    if (!rowData) continue;
    
    const projectName = (rowData[2] || '').trim();
    if (!projectName) continue;
    
    const trial = {
      seq: rowData[0] || '',
      workOrder: rowData[1] || '',
      name: projectName,
      isKey: rowData[3] || '',
      stage: (rowData[4] || '').trim(),
      productType: (rowData[5] || '').trim(),
      productName: (rowData[6] || '').trim(),
      totalQty: rowData[7] || '',
      deliveryDate: rowData[8] || '',
      pm: (rowData[9] || '').trim(),
      platform: rowData[10] || '',
      strategy: rowData[11] || '',
      _rowIndex: r,
    };
    rows.push(trial);
  }
  
  return rows;
}

// ==================== 概览统计 ====================

export function computeOverviewStats(projects, productionData, exceptions) {
  // 项目总数（去重）
  const uniqueProjects = new Set(projects.map(p => p.name)).size;
  
  // 各环节项目数
  const stageCounts = {};
  PROJECT_STAGES.forEach(s => stageCounts[s] = 0);
  projects.forEach(p => {
    const stage = p.stage;
    if (stageCounts[stage] !== undefined) {
      stageCounts[stage]++;
    }
  });
  
  // 子项数
  const subItemCount = projects.length;
  
  // 已交付台数（仅自制，stage为入库发货）
  const deliveredCount = projects.filter(p => p.stage === '入库发货').length;
  
  // 各项目经理负责的项目数
  const pmStats = {};
  projects.forEach(p => {
    const pm = p.pm || p.projectManager;
    if (!pm) return;
    if (!pmStats[pm]) {
      pmStats[pm] = { projects: new Set(), subItems: 0 };
    }
    pmStats[pm].projects.add(p.name);
    pmStats[pm].subItems++;
  });
  
  // 各产品线项目数
  const productLineStats = {};
  PRODUCT_LINES.forEach(pl => productLineStats[pl] = 0);
  projects.forEach(p => {
    const pt = p.productType;
    if (pt === '箱变') productLineStats['箱变']++;
    else if (pt === '低压开关柜' || pt === '高压柜') productLineStats['成套开关']++;
    else if (pt === '变桨柜' || pt === '主控柜' || pt === '机舱柜' || pt === '塔基柜' || pt === '偏航柜' || pt === '配电柜') productLineStats['装备电控']++;
    else if (pt === '自动化控制柜' || pt === '自动化柜') productLineStats['自动化']++;
  });
  
  // 异常统计
  const openExceptions = exceptions.filter(e => {
    const desc = (e.description || '').toLowerCase();
    return !desc.includes('已闭环') && !desc.includes('闭环');
  });
  
  const criticalExceptions = exceptions.filter(e => {
    const level = (e.level || '').toLowerCase();
    return level.includes('重大') || level.includes('严重');
  });
  
  return {
    totalProjects: uniqueProjects,
    totalSubItems: subItemCount,
    deliveredCount,
    stageCounts,
    pmStats: Object.fromEntries(
      Object.entries(pmStats).map(([k, v]) => [k, { projectCount: v.projects.size, subItemCount: v.subItems }])
    ),
    productLineStats,
    totalExceptions: exceptions.length,
    openExceptions: openExceptions.length,
    criticalExceptions: criticalExceptions.length,
  };
}

// ==================== 预警/超期计算 ====================

export function computeAlerts(projects, exceptions) {
  const today = new Date('2026-07-09'); // 当前日期
  const alerts = [];
  const overdue = [];
  
  // 从异常台账中找出预警/超期项
  exceptions.forEach(e => {
    const plannedClose = e.plannedClose || e.requiredClose;
    if (!plannedClose) return;
    
    const plannedDate = parseDate(plannedClose);
    if (!plannedDate) return;
    
    const daysDiff = Math.floor((plannedDate - today) / (1000 * 60 * 60 * 24));
    
    const item = {
      projectName: e.projectName,
      productType: e.productType,
      pm: e.pm,
      stage: e.exceptionStage,
      plannedClose: plannedClose,
      description: e.description,
      solution: e.solution,
      daysDiff,
    };
    
    if (daysDiff < 0) {
      overdue.push(item);
    } else if (daysDiff <= 1) {
      alerts.push(item);
    }
  });
  
  return { alerts, overdue };
}

// ==================== 工具函数 ====================

function parseDate(dateStr) {
  if (!dateStr) return null;
  // 尝试多种格式
  const formats = [
    /(\d{4})[\-/](\d{1,2})[\-/](\d{1,2})/,
    /(\d{4})年(\d{1,2})月(\d{1,2})日/,
    /(\d{1,2})月(\d{1,2})日/,
  ];
  
  for (const regex of formats) {
    const match = dateStr.match(regex);
    if (match) {
      if (match.length === 4) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      }
    }
  }
  
  // 尝试直接解析
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  
  return null;
}

export function formatNumber(num) {
  if (!num) return '0';
  const n = parseFloat(num);
  if (isNaN(n)) return num;
  return n.toLocaleString('zh-CN');
}

export function formatPercent(val) {
  if (!val) return '0%';
  const p = parseFloat(val);
  if (isNaN(p)) return val;
  return p.toFixed(1) + '%';
}
