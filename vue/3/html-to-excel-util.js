import * as XLSX from 'xlsx';

/**
 * 将HTML表格转换为Excel文件并下载
 * @param {string} tableHtml - 表格的HTML字符串
 * @param {string} fileName - 下载的文件名（不含扩展名）
 * @param {object} options - 配置选项
 * @returns {Promise<void>}
 */
export const htmlTableToExcel = (tableHtml, fileName, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      // 使用浏览器DOM API解析HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(tableHtml, 'text/html');
      const table = doc.querySelector('table');
      
      if (!table) {
        reject(new Error('无效的表格HTML'));
        return;
      }
      
      // 创建工作簿和工作表
      const wb = XLSX.utils.book_new();
      
      // 获取表格行
      const rows = table.querySelectorAll('tr');
      if (rows.length === 0) {
        reject(new Error('表格没有行'));
        return;
      }
      
      // 数据和样式映射
      const data = [];
      const merges = [];
      const styles = {};
      const colWidths = [];
      const rowHeights = [];
      
      // 处理表头行以获取列数
      const headerRow = rows[0];
      const headerCells = headerRow.querySelectorAll('th, td');
      const colCount = Array.from(headerCells).reduce((count, cell) => {
        return count + (parseInt(cell.getAttribute('colspan') || 1));
      }, 0);
      
      // 初始化样式映射
      for (let r = 0; r < rows.length; r++) {
        styles[r] = {};
      }
      
      // 处理列宽
      Array.from(headerCells).forEach((cell, index) => {
        const width = getComputedWidth(cell);
        colWidths.push({ wch: Math.max(8, width) });
      });
      
      // 如果列宽不足，填充剩余的列
      while (colWidths.length < colCount) {
        colWidths.push({ wch: 8 });
      }
      
      // 当前记录的行数（用于处理rowspan）
      let excelRowIndex = 0;
      
      // 处理每一行
      rows.forEach((row, rowIndex) => {
        // 获取行高
        const height = getComputedHeight(row);
        rowHeights.push({ hpt: height });
        
        const cells = row.querySelectorAll('th, td');
        const dataRow = [];
        let excelColIndex = 0;
        
        // 处理每个单元格
        cells.forEach((cell, cellIndex) => {
          // 跳过已经被合并的单元格位置
          while (isCellOccupied(data, excelRowIndex, excelColIndex)) {
            dataRow.push(null);
            excelColIndex++;
          }
          
          // 获取单元格内容
          const cellContent = cell.textContent.trim();
          dataRow.push(cellContent);
          
          // 处理单元格样式
          const cellStyle = getCellStyle(cell);
          styles[excelRowIndex][excelColIndex] = cellStyle;
          
          // 处理合并单元格
          const rowspan = parseInt(cell.getAttribute('rowspan') || 1);
          const colspan = parseInt(cell.getAttribute('colspan') || 1);
          
          if (rowspan > 1 || colspan > 1) {
            const mergeRange = {
              s: { r: excelRowIndex, c: excelColIndex },
              e: { r: excelRowIndex + rowspan - 1, c: excelColIndex + colspan - 1 }
            };
            merges.push(mergeRange);
            
            // 填充被合并的单元格位置
            for (let r = 0; r < rowspan; r++) {
              for (let c = 0; c < colspan; c++) {
                if (r === 0 && c === 0) continue; // 跳过当前单元格
                
                const targetRow = excelRowIndex + r;
                const targetCol = excelColIndex + c;
                
                // 确保行存在
                while (data.length <= targetRow) {
                  data.push([]);
                }
                
                // 标记该位置已占用
                while (data[targetRow].length <= targetCol) {
                  data[targetRow].push(null);
                }
              }
            }
          }
          
          excelColIndex += colspan;
        });
        
        // 添加数据行
        data.push(dataRow);
        excelRowIndex++;
      });
      
      // 创建工作表
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // 应用合并单元格
      ws['!merges'] = merges;
      
      // 应用列宽
      ws['!cols'] = colWidths;
      
      // 应用行高
      ws['!rows'] = rowHeights;
      
      // 应用样式（需要xlsx-js-style库支持，这里仅做准备）
      if (typeof XLSX.utils.book_append_sheet_with_style === 'function') {
        for (const row in styles) {
          for (const col in styles[row]) {
            const ref = XLSX.utils.encode_cell({ r: row, c: col });
            if (!ws[ref]) continue;
            
            ws[ref].s = styles[row][col];
          }
        }
      }
      
      // 将工作表添加到工作簿
      XLSX.utils.book_append_sheet(wb, ws, '表格数据');
      
      // 生成Excel文件并下载
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      
      resolve();
    } catch (error) {
      console.error('导出表格时出错:', error);
      reject(error);
    }
  });
};

/**
 * 检查单元格是否已被占用（由合并单元格）
 * @param {Array} data - 数据数组
 * @param {number} row - 行索引
 * @param {number} col - 列索引
 * @returns {boolean}
 */
function isCellOccupied(data, row, col) {
  if (row >= data.length) return false;
  const rowData = data[row];
  return col < rowData.length && rowData[col] === null;
}

/**
 * 获取计算后的单元格宽度（转换为Excel列宽）
 * @param {HTMLElement} cell - 单元格元素
 * @returns {number} 列宽
 */
function getComputedWidth(cell) {
  const width = cell.offsetWidth || 0;
  // 将像素转换为Excel列宽（大约像素 / 8）
  return Math.ceil(width / 8);
}

/**
 * 获取计算后的行高（转换为Excel点数）
 * @param {HTMLElement} row - 行元素
 * @returns {number} 行高（点数）
 */
function getComputedHeight(row) {
  const height = row.offsetHeight || 0;
  // 将像素转换为点数（大约像素 * 0.75）
  return Math.ceil(height * 0.75);
}

/**
 * 获取单元格样式属性
 * @param {HTMLElement} cell - 单元格元素
 * @returns {object} 样式对象
 */
function getCellStyle(cell) {
  const computedStyle = window.getComputedStyle(cell);
  
  // 处理背景色
  const backgroundColor = computedStyle.backgroundColor;
  let bgColor = null;
  if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
    bgColor = rgbToHex(backgroundColor);
  }
  
  // 处理文字颜色
  const color = computedStyle.color;
  let fgColor = null;
  if (color) {
    fgColor = rgbToHex(color);
  }
  
  // 处理对齐方式
  const horizontalAlign = computedStyle.textAlign || 'left';
  const verticalAlign = computedStyle.verticalAlign || 'middle';
  
  // 处理字体样式
  const bold = computedStyle.fontWeight >= 700;
  const italic = computedStyle.fontStyle === 'italic';
  const underline = computedStyle.textDecoration.includes('underline');
  const strikethrough = computedStyle.textDecoration.includes('line-through');
  
  // 处理字体大小
  const fontSize = parseInt(computedStyle.fontSize) || 12;
  
  // 处理字体名称
  const fontFamily = computedStyle.fontFamily || 'Arial';
  
  // 处理边框
  const borderTop = parseBorder(computedStyle.borderTop);
  const borderRight = parseBorder(computedStyle.borderRight);
  const borderBottom = parseBorder(computedStyle.borderBottom);
  const borderLeft = parseBorder(computedStyle.borderLeft);
  
  return {
    fill: bgColor ? { fgColor: { rgb: bgColor } } : null,
    font: {
      name: fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
      sz: fontSize,
      color: fgColor ? { rgb: fgColor } : null,
      bold,
      italic,
      underline,
      strike: strikethrough
    },
    alignment: {
      horizontal: convertHorizontalAlign(horizontalAlign),
      vertical: convertVerticalAlign(verticalAlign),
      wrapText: true
    },
    border: {
      top: borderTop,
      right: borderRight,
      bottom: borderBottom,
      left: borderLeft
    }
  };
}

/**
 * 将RGB颜色转换为十六进制颜色
 * @param {string} rgb - RGB颜色字符串
 * @returns {string} 十六进制颜色
 */
function rgbToHex(rgb) {
  // 解析RGB字符串
  const rgbMatch = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/i);
  if (!rgbMatch) return 'FFFFFF';
  
  const r = parseInt(rgbMatch[1]);
  const g = parseInt(rgbMatch[2]);
  const b = parseInt(rgbMatch[3]);
  
  // 转换为十六进制
  const componentToHex = c => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/**
 * 解析边框样式
 * @param {string} borderStyle - CSS边框样式
 * @returns {object} 边框对象
 */
function parseBorder(borderStyle) {
  if (!borderStyle || borderStyle === 'none' || borderStyle === '0px none') {
    return null;
  }
  
  const borderMatch = borderStyle.match(/(\d+px)\s+(\w+)\s+([^;]+)/i);
  if (!borderMatch) return null;
  
  const width = borderMatch[1];
  const style = borderMatch[2];
  const color = borderMatch[3];
  
  // 获取边框宽度（像素）
  const widthPx = parseInt(width) || 1;
  
  // 获取边框样式
  let borderStyleValue = 'thin';
  if (widthPx > 3) {
    borderStyleValue = 'thick';
  } else if (widthPx > 1) {
    borderStyleValue = 'medium';
  }
  
  // 根据CSS边框样式确定Excel边框样式
  if (style === 'dashed') {
    borderStyleValue = 'dashed';
  } else if (style === 'dotted') {
    borderStyleValue = 'dotted';
  } else if (style === 'double') {
    borderStyleValue = 'double';
  }
  
  // 处理边框颜色
  let borderColor = 'FFFFFF';
  if (color) {
    borderColor = rgbToHex(color);
  }
  
  return {
    style: borderStyleValue,
    color: { rgb: borderColor }
  };
}

/**
 * 转换水平对齐方式
 * @param {string} align - CSS对齐方式
 * @returns {string} Excel对齐方式
 */
function convertHorizontalAlign(align) {
  switch (align) {
    case 'left': return 'left';
    case 'center': return 'center';
    case 'right': return 'right';
    case 'justify': return 'justify';
    default: return 'left';
  }
}

/**
 * 转换垂直对齐方式
 * @param {string} align - CSS对齐方式
 * @returns {string} Excel对齐方式
 */
function convertVerticalAlign(align) {
  switch (align) {
    case 'top': return 'top';
    case 'middle': return 'center';
    case 'bottom': return 'bottom';
    default: return 'center';
  }
}

/**
 * 为表格中的导出按钮添加事件处理
 * @param {string} tableSelector - 表格选择器
 * @param {string} buttonSelector - 按钮选择器
 * @param {string} fileName - 文件名（不含扩展名）
 */
export const setupTableExportButtons = (tableSelector, buttonSelector, fileName = 'table-export') => {
  // 获取所有表格
  const tables = document.querySelectorAll(tableSelector);
  
  tables.forEach((table, index) => {
    // 在表格后添加导出按钮
    const exportButton = document.createElement('button');
    exportButton.className = buttonSelector.replace(/^\./, ''); // 移除选择器前的点
    exportButton.textContent = `导出表格 ${index + 1}`;
    exportButton.addEventListener('click', () => {
      const tableHtml = table.outerHTML;
      htmlTableToExcel(tableHtml, `${fileName}-${index + 1}`)
        .then(() => {
          console.log(`表格 ${index + 1} 导出成功`);
        })
        .catch(error => {
          console.error(`表格 ${index + 1} 导出失败:`, error);
        });
    });
    
    // 将按钮添加到表格后
    table.parentNode.insertBefore(exportButton, table.nextSibling);
  });
};

export default {
  htmlTableToExcel,
  setupTableExportButtons
};
