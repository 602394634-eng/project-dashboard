// WPS API 封装
// 由于WPS API需要后端认证，这里使用本地缓存数据模式
// 实际部署时，可以通过后端API转发WPS请求

const FILE_ID = 'RUPn6afnmxMEihs1Bb5N1xUmgNcNGTwmW';
const WPS_BASE = 'https://api.wps.cn/office';

// 本地缓存数据（从之前读取的WPS表格数据导出）
// 实际使用时，这些数据应该通过后端API从WPS实时获取

// 模拟从WPS获取sheet数据
// 实际部署时，这里应该调用后端API
export async function fetchSheetData(sheetId, range) {
  // 这里使用本地JSON数据文件
  // 实际部署时改为 fetch('/api/sheet/...')
  const response = await fetch(`/data/sheet_${sheetId}.json`);
  if (!response.ok) {
    throw new Error('Failed to fetch sheet data');
  }
  return response.json();
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
