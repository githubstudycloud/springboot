/**
 * 这个文件提供安装xlsx-js-style库的说明和配置方法
 * xlsx-js-style是xlsx的扩展，支持Excel样式导出
 */

/*
安装步骤：

1. 卸载原始的xlsx库（如果已安装）
   npm uninstall xlsx

2. 安装xlsx-js-style库
   npm install xlsx-js-style

3. 在代码中替换导入语句
   原来的导入: import * as XLSX from 'xlsx';
   新的导入: import * as XLSX from 'xlsx-js-style';

4. 确保在package.json中的依赖项已更新
   "dependencies": {
     // 其他依赖...
     "xlsx-js-style": "^1.2.0"
   }

样式支持说明：
- xlsx-js-style支持单元格背景色、字体、边框、对齐方式等样式
- 需要使用特定的写入方法 writeFile 而不是原库的 write
- 样式需要通过单元格的's'属性设置

样式对象示例:
{
  font: {
    name: 'Arial',
    sz: 12,
    color: { rgb: "FF0000" },
    bold: true,
    italic: false,
    underline: false
  },
  fill: {
    fgColor: { rgb: "FFFF00" }
  },
  border: {
    top: { style: 'thin', color: { rgb: "000000" } },
    right: { style: 'thin', color: { rgb: "000000" } },
    bottom: { style: 'thin', color: { rgb: "000000" } },
    left: { style: 'thin', color: { rgb: "000000" } }
  },
  alignment: {
    horizontal: 'center',
    vertical: 'center',
    wrapText: true
  }
}

使用方法：
在htmlTableToExcel.js中，将XLSX的导入改为xlsx-js-style，
然后可以使用单元格的's'属性设置样式：

ws['A1'] = { v: 'Hello', s: { font: { bold: true } } };

*/

// 检查是否已安装xlsx-js-style
export const checkXlsxStyleInstallation = () => {
  try {
    // 尝试导入xlsx-js-style
    const XLSX = require('xlsx-js-style');
    // 检查是否有样式相关方法
    const hasStyleSupport = 
      typeof XLSX.utils.book_append_sheet === 'function' && 
      typeof XLSX.writeFile === 'function';
    
    return {
      installed: true,
      hasStyleSupport,
      version: XLSX.version
    };
  } catch (e) {
    return {
      installed: false,
      hasStyleSupport: false,
      error: e.message
    };
  }
};

export default {
  checkXlsxStyleInstallation
};