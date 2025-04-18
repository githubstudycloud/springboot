/**
 * 生成具有各种样式和功能的示例表格HTML
 * 用于测试HTML表格导出为Excel的功能
 */

/**
 * 生成简单表格示例
 * @returns {string} 表格HTML
 */
export const generateSimpleTable = () => {
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">姓名</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">年龄</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">部门</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">职位</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">入职日期</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">张三</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">28</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">研发部</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">前端工程师</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">2021-06-15</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">李四</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">32</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">设计部</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">UI设计师</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">2020-03-22</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">王五</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">35</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">市场部</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">产品经理</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">2019-11-08</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">赵六</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">26</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">研发部</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">后端工程师</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">2022-01-10</td>
        </tr>
      </tbody>
    </table>
  `;
};

/**
 * 生成带有合并单元格的表格示例
 * @returns {string} 表格HTML
 */
export const generateMergedCellsTable = () => {
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #4CAF50; color: white;">
          <th colspan="5" style="border: 1px solid #ddd; padding: 12px; text-align: center; font-size: 18px;">
            2023年度销售报表
          </th>
        </tr>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">季度</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">产品A</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">产品B</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">产品C</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">总计</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">第一季度</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">125,000</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">86,000</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">42,500</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">253,500</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">第二季度</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">148,000</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">92,500</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">53,000</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">293,500</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">第三季度</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">162,500</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">105,000</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">68,000</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">335,500</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">第四季度</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">185,000</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">120,500</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">72,000</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">377,500</td>
        </tr>
        <tr style="background-color: #e6f7ff;">
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">全年总计</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">620,500</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">404,000</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">235,500</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold; background-color: #ffeb3b;">1,260,000</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="5" style="border: 1px solid #ddd; padding: 8px; text-align: right; font-style: italic;">
            * 所有金额单位为元人民币
          </td>
        </tr>
      </tfoot>
    </table>
  `;
};

/**
 * 生成具有复杂样式的表格示例
 * @returns {string} 表格HTML
 */
export const generateStyledTable = () => {
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: Arial, sans-serif;">
      <thead>
        <tr>
          <th colspan="6" style="background-color: #1a237e; color: white; padding: 15px; text-align: center; font-size: 20px; border: 2px solid #0d47a1;">
            公司项目进度跟踪表
          </th>
        </tr>
        <tr style="background-color: #bbdefb;">
          <th style="border: 2px solid #90caf9; padding: 10px; text-align: center; width: 15%;">项目名称</th>
          <th style="border: 2px solid #90caf9; padding: 10px; text-align: center; width: 15%;">负责人</th>
          <th style="border: 2px solid #90caf9; padding: 10px; text-align: center; width: 15%;">开始日期</th>
          <th style="border: 2px solid #90caf9; padding: 10px; text-align: center; width: 15%;">计划完成</th>
          <th style="border: 2px solid #90caf9; padding: 10px; text-align: center; width: 15%;">当前进度</th>
          <th style="border: 2px solid #90caf9; padding: 10px; text-align: center; width: 25%;">备注</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: left; font-weight: bold;">官网重设计</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center;">王艺林</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center;">2023-01-15</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center;">2023-03-30</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center; background-color: #a5d6a7; color: #1b5e20; font-weight: bold;">100%</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: left; font-style: italic;">已验收上线</td>
        </tr>
        <tr style="background-color: #e3f2fd;">
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: left; font-weight: bold;">移动应用开发</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center;">张涛</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center;">2023-02-01</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center;">2023-06-15</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center; background-color: #ffecb3; color: #e65100; font-weight: bold;">75%</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: left; font-style: italic;">前端开发完成，后端对接中</td>
        </tr>
        <tr>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: left; font-weight: bold;">数据分析平台</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center;">李梅</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center;">2023-03-10</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center;">2023-07-30</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center; background-color: #ffecb3; color: #e65100; font-weight: bold;">60%</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: left; font-style: italic;">核心功能已实现，性能优化中</td>
        </tr>
        <tr style="background-color: #e3f2fd;">
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: left; font-weight: bold;">客户管理系统</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center;">赵明</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center;">2023-04-05</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center;">2023-09-10</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center; background-color: #ffcdd2; color: #b71c1c; font-weight: bold;">35%</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: left; font-style: italic;">需求变更较多，进度延迟</td>
        </tr>
        <tr>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: left; font-weight: bold;">智能客服机器人</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center;">陈晓</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center;">2023-05-20</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center;">2023-08-15</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: center; background-color: #ffcdd2; color: #b71c1c; font-weight: bold;">25%</td>
          <td style="border: 2px solid #90caf9; padding: 10px; text-align: left; font-style: italic;">技术调研阶段，算法模型构建中</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="6" style="border: 2px solid #90caf9; padding: 10px; text-align: center; background-color: #e8eaf6; font-weight: bold;">
            截至2023年6月30日项目进度情况
          </td>
        </tr>
      </tfoot>
    </table>
  `;
};

/**
 * 生成具有复杂合并单元格的表格示例
 * @returns {string} 表格HTML
 */
export const generateComplexMergedTable = () => {
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: 'Microsoft YaHei', sans-serif;">
      <thead>
        <tr style="background-color: #343a40; color: white;">
          <th colspan="7" style="border: 1px solid #495057; padding: 15px; text-align: center; font-size: 20px;">
            2023年第一季度销售业绩表
          </th>
        </tr>
        <tr style="background-color: #495057; color: white;">
          <th rowspan="2" style="border: 1px solid #6c757d; padding: 10px; text-align: center; vertical-align: middle;">区域</th>
          <th colspan="2" style="border: 1px solid #6c757d; padding: 10px; text-align: center;">1月</th>
          <th colspan="2" style="border: 1px solid #6c757d; padding: 10px; text-align: center;">2月</th>
          <th colspan="2" style="border: 1px solid #6c757d; padding: 10px; text-align: center;">3月</th>
        </tr>
        <tr style="background-color: #6c757d; color: white;">
          <th style="border: 1px solid #adb5bd; padding: 8px; text-align: center;">销售额</th>
          <th style="border: 1px solid #adb5bd; padding: 8px; text-align: center;">目标完成率</th>
          <th style="border: 1px solid #adb5bd; padding: 8px; text-align: center;">销售额</th>
          <th style="border: 1px solid #adb5bd; padding: 8px; text-align: center;">目标完成率</th>
          <th style="border: 1px solid #adb5bd; padding: 8px; text-align: center;">销售额</th>
          <th style="border: 1px solid #adb5bd; padding: 8px; text-align: center;">目标完成率</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: center; font-weight: bold; background-color: #e9ecef;">华东区</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: right;">350,000</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: center; background-color: #d4edda; color: #155724;">105%</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: right;">320,000</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: center; background-color: #d4edda; color: #155724;">98%</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: right;">380,000</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: center; background-color: #d4edda; color: #155724;">112%</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: center; font-weight: bold; background-color: #e9ecef;">华北区</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: right;">280,000</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: center; background-color: #fff3cd; color: #856404;">92%</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: right;">305,000</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: center; background-color: #d4edda; color: #155724;">101%</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: right;">330,000</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: center; background-color: #d4edda; color: #155724;">108%</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: center; font-weight: bold; background-color: #e9ecef;">华南区</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: right;">265,000</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: center; background-color: #fff3cd; color: #856404;">88%</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: right;">245,000</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: center; background-color: #f8d7da; color: #721c24;">81%</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: right;">290,000</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: center; background-color: #fff3cd; color: #856404;">95%</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: center; font-weight: bold; background-color: #e9ecef;">西部区</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: right;">195,000</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: center; background-color: #f8d7da; color: #721c24;">78%</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: right;">210,000</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: center; background-color: #fff3cd; color: #856404;">84%</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: right;">250,000</td>
          <td style="border: 1px solid #ced4da; padding: 8px; text-align: center; background-color: #d4edda; color: #155724;">100%</td>
        </tr>
      </tbody>
      <tfoot>
        <tr style="background-color: #343a40; color: white;">
          <td style="border: 1px solid #495057; padding: 8px; text-align: center; font-weight: bold;">总计</td>
          <td colspan="2" style="border: 1px solid #495057; padding: 8px; text-align: center; font-weight: bold;">1,090,000</td>
          <td colspan="2" style="border: 1px solid #495057; padding: 8px; text-align: center; font-weight: bold;">1,080,000</td>
          <td colspan="2" style="border: 1px solid #495057; padding: 8px; text-align: center; font-weight: bold;">1,250,000</td>
        </tr>
      </tfoot>
    </table>
  `;
};

/**
 * 根据表格类型获取相应的示例表格
 * @param {string} type - 表格类型 (simple, merged, styled, complex)
 * @returns {string} 表格HTML
 */
export const getSampleTable = (type = 'simple') => {
  switch (type.toLowerCase()) {
    case 'merged':
      return generateMergedCellsTable();
    case 'styled':
      return generateStyledTable();
    case 'complex':
      return generateComplexMergedTable();
    case 'simple':
    default:
      return generateSimpleTable();
  }
};

export default {
  generateSimpleTable,
  generateMergedCellsTable,
  generateStyledTable,
  generateComplexMergedTable,
  getSampleTable
};