// WPS API 封装 - 支持后端API和本地JSON双模式
// 优先使用后端API获取实时数据，后端不可用时回退到本地静态JSON

const API_BASE = import.meta.env.VITE_API_BASE || '';
const USE_API = import.meta.env.VITE_USE_API !== 'false';

// Sheet ID 映射
const SHEET_IDS = [2, 13, 1, 11, 5, 15];

/**
 * 从后端API获取所有sheet数据（实时同步模式）
 */
async function fetchFromApi() {
  const response = await fetch(`${API_BASE}/api/all`);
  if (!response.ok) throw new Error('API fetch failed');
  const result = await response.json();
  
  const sheets = {};
  for (const [id, info] of Object.entries(result.sheets)) {
    sheets[parseInt(id)] = parseRangeData(info.rangeData);
  }
  return sheets;
}

/**
 * 从本地JSON文件获取数据（静态模式）
 */
async function fetchFromLocal(sheetId) {
  const response = await fetch(`/data/sheet_${sheetId}.json`);
  if (!response.ok) throw new Error(`Failed to load sheet ${sheetId}`);
  const data = await response.json();
  return parseRangeData(data.rangeData);
}

/**
 * 加载所有sheet数据 - 自动选择数据源
 */
export async function loadAllSheets() {
  // 首先尝试从后端API获取
  if (USE_API) {
    try {
      console.log('📡 正在从后端API获取实时数据...');
      const sheets = await fetchFromApi();
      console.log('✅ 实时数据加载成功');
      return sheets;
    } catch (e) {
      console.warn('⚠️ 后端API不可用，切换到本地数据:', e.message);
    }
  }
  
  // 回退到本地JSON
  console.log('📂 从本地JSON加载数据...');
  const sheets = {};
  for (const id of SHEET_IDS) {
    try {
      sheets[id] = await fetchFromLocal(id);
    } catch (e) {
      console.error(`Failed to load sheet ${id}:`, e);
    }
  }
  console.log('✅ 本地数据加载完成');
  return sheets;
}

/**
 * 触发后端数据同步
 */
export async function triggerSync() {
  if (!USE_API) return null;
  try {
    const response = await fetch(`${API_BASE}/api/sync`, { method: 'POST' });
    return response.json();
  } catch (e) {
    console.warn('Sync trigger failed:', e);
    return null;
  }
}

/**
 * 获取同步状态
 */
export async function getSyncStatus() {
  if (!USE_API) return null;
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.json();
  } catch (e) {
    return null;
  }
}

// 从WPS API原始格式解析为结构化数据
export function parseRangeData(rangeData) {
  const cellsByRow = {};
  for (const cell of rangeData) {
    const row = cell.originRow;
    const col = cell.originCol;
    const text = cell.cellText || '';
    if (!cellsByRow[row]) {
      cellsByRow[row] = {};
    }
    cellsByRow[row][col] = text;
  }
  return cellsByRow;
}

// 将cellsByRow转换为数组格式
export function cellsToArray(cellsByRow) {
  const rows = [];
  const rowIndices = Object.keys(cellsByRow).map(Number).sort((a, b) => a - b);
  const maxRow = Math.max(...rowIndices);
  
  for (let r = 0; r <= maxRow; r++) {
    const rowData = cellsByRow[r] || {};
    const colIndices = Object.keys(rowData).map(Number).sort((a, b) => a - b);
    const maxCol = colIndices.length > 0 ? Math.max(...colIndices) : 0;
    const rowArray = [];
    for (let c = 0; c <= maxCol; c++) {
      rowArray.push(rowData[c] || '');
    }
    rows.push(rowArray);
  }
  return rows;
}

// 查找表头行
export function findHeaderRow(cellsByRow, minCols = 3) {
  const rows = Object.keys(cellsByRow).map(Number).sort((a, b) => a - b);
  for (const r of rows) {
    const nonEmpty = Object.values(cellsByRow[r]).filter(v => v && v.trim()).length;
    if (nonEmpty >= minCols) {
      return r;
    }
  }
  return 0;
}

// 解析表头
export function parseHeaders(cellsByRow, headerRow) {
  const headers = {};
  const rowData = cellsByRow[headerRow] || {};
  for (const [col, text] of Object.entries(rowData)) {
    headers[col] = text.trim();
  }
  return headers;
}

// 将数据行解析为对象数组
export function parseDataRows(cellsByRow, headerRow) {
  const headers = parseHeaders(cellsByRow, headerRow);
  const rows = [];
  const rowIndices = Object.keys(cellsByRow).map(Number).sort((a, b) => a - b);
  
  for (const r of rowIndices) {
    if (r <= headerRow) continue;
    const rowData = cellsByRow[r];
    const nonEmpty = Object.values(rowData).filter(v => v && v.trim()).length;
    if (nonEmpty === 0) continue;
    
    const obj = {};
    for (const [col, header] of Object.entries(headers)) {
      obj[header] = rowData[col] || '';
    }
    obj._rowIndex = r;
    rows.push(obj);
  }
  return rows;
}
