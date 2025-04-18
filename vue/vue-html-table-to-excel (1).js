// 项目结构：
// - public/
// - src/
//   - assets/
//   - components/
//     - RichTextEditor.vue
//   - App.vue
//   - main.js
// - package.json
// - vue.config.js

// package.json
{
  "name": "vue-html-table-to-excel",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build",
    "lint": "vue-cli-service lint"
  },
  "dependencies": {
    "core-js": "^3.32.1",
    "vue": "^2.7.14",
    "quill": "^1.3.7",
    "xlsx": "^0.18.5",
    "vue-quill-editor": "^3.0.6"
  },
  "devDependencies": {
    "@vue/cli-plugin-babel": "~5.0.8",
    "@vue/cli-plugin-eslint": "~5.0.8",
    "@vue/cli-service": "~5.0.8",
    "babel-eslint": "^10.1.0",
    "eslint": "^7.32.0",
    "eslint-plugin-vue": "^9.17.0"
  },
  "eslintConfig": {
    "root": true,
    "env": {
      "node": true
    },
    "extends": [
      "plugin:vue/essential",
      "eslint:recommended"
    ],
    "parserOptions": {
      "parser": "babel-eslint"
    },
    "rules": {}
  },
  "browserslist": [
    "> 1%",
    "last 2 versions",
    "not dead"
  ]
}

// vue.config.js
module.exports = {
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      fallback: {
        stream: false,
        fs: false,
        path: false,
        crypto: false
      }
    }
  }
}

// src/main.js
import Vue from 'vue';
import App from './App.vue';
import VueQuillEditor from 'vue-quill-editor';

// 引入Quill样式
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';
import 'quill/dist/quill.bubble.css';

Vue.use(VueQuillEditor);
Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');

// src/App.vue
<template>
  <div id="app">
    <h1>富文本表格导出Excel示例</h1>
    <RichTextEditor />
  </div>
</template>

<script>
import RichTextEditor from './components/RichTextEditor.vue';

export default {
  name: 'App',
  components: {
    RichTextEditor
  }
}
</script>

<style>
#app {
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 20px auto;
  max-width: 1200px;
  padding: 0 20px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}
</style>

// src/components/RichTextEditor.vue
<template>
  <div class="editor-container">
    <div class="editor-header">
      <button class="btn" @click="loadSampleTable">插入示例表格</button>
      <button class="btn" @click="identifyAndExportTables">识别并导出表格</button>
    </div>
    
    <div class="editor-wrapper">
      <quill-editor
        ref="quillEditor"
        v-model="content"
        :options="editorOption"
        @change="onEditorChange"
      />
    </div>
    
    <div v-if="tablesFound" class="tables-container">
      <h3>发现的表格：</h3>
      <div v-for="(table, index) in foundTables" :key="index" class="table-item">
        <div class="table-preview" v-html="table.preview"></div>
        <button class="btn export-btn" @click="exportTableToExcel(table.html, `表格${index+1}`)">
          导出表格 {{index+1}} 为Excel
        </button>
      </div>
    </div>
    
    <div class="export-info" v-if="exportInfo">
      <p>{{ exportInfo }}</p>
    </div>
  </div>
</template>

<script>
import * as XLSX from 'xlsx';
// 注释掉JSDOM，改用浏览器DOM API
// import { JSDOM } from 'jsdom';

export default {
  name: 'RichTextEditor',
  data() {
    return {
      content: '',
      editorOption: {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['table'],
            ['clean']
          ],
          table: true
        },
        placeholder: '请输入内容...'
      },
      foundTables: [],
      tablesFound: false,
      exportInfo: ''
    };
  },
  methods: {
    onEditorChange() {
      // 编辑器内容变化时可以添加其他逻辑
    },
    loadSampleTable() {
      // 插入示例表格
      const tableHTML = `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">姓名</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">年龄</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">部门</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">职位</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">入职日期</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">张三</td>
              <td style="border: 1px solid #ddd; padding: 8px;">28</td>
              <td style="border: 1px solid #ddd; padding: 8px;">研发部</td>
              <td style="border: 1px solid #ddd; padding: 8px;">前端工程师</td>
              <td style="border: 1px solid #ddd; padding: 8px;">2021-06-15</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="border: 1px solid #ddd; padding: 8px;">李四</td>
              <td style="border: 1px solid #ddd; padding: 8px;">32</td>
              <td style="border: 1px solid #ddd; padding: 8px;">设计部</td>
              <td style="border: 1px solid #ddd; padding: 8px;">UI设计师</td>
              <td style="border: 1px solid #ddd; padding: 8px;">2020-03-22</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">王五</td>
              <td style="border: 1px solid #ddd; padding: 8px;">35</td>
              <td style="border: 1px solid #ddd; padding: 8px;">市场部</td>
              <td style="border: 1px solid #ddd; padding: 8px;">产品经理</td>
              <td style="border: 1px solid #ddd; padding: 8px;">2019-11-08</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="border: 1px solid #ddd; padding: 8px;">赵六</td>
              <td style="border: 1px solid #ddd; padding: 8px;">26</td>
              <td style="border: 1px solid #ddd; padding: 8px;">研发部</td>
              <td style="border: 1px solid #ddd; padding: 8px;">后端工程师</td>
              <td style="border: 1px solid #ddd; padding: 8px;">2022-01-10</td>
            </tr>
          </tbody>
        </table>
      `;
      
      // 获取Quill编辑器实例
      const quill = this.$refs.quillEditor.quill;
      
      // 获取当前光标位置
      const range = quill.getSelection();
      const position = range ? range.index : 0;
      
      // 在光标位置插入HTML
      quill.clipboard.dangerouslyPasteHTML(position, tableHTML);
      
      this.exportInfo = '已插入示例表格，可以点击"识别并导出表格"按钮';
    },
    identifyAndExportTables() {
      // 获取编辑器HTML内容
      const editorContent = this.content;
      
      // 使用浏览器DOM API而不是JSDOM
      const parser = new DOMParser();
      const doc = parser.parseFromString(editorContent, 'text/html');
      const tables = doc.querySelectorAll('table');
      
      if (tables.length === 0) {
        this.exportInfo = '未找到表格，请先插入表格';
        this.tablesFound = false;
        this.foundTables = [];
        return;
      }
      
      // 清空之前的表格
      this.foundTables = [];
      
      // 处理找到的每个表格
      tables.forEach((table, index) => {
        // 获取完整的表格HTML
        const tableHTML = table.outerHTML;
        
        // 创建预览（仅显示前两行）
        const tableClone = table.cloneNode(true);
        const tbody = tableClone.querySelector('tbody');
        if (tbody && tbody.rows.length > 2) {
          // 保留表头和前两行，删除其余行
          while (tbody.rows.length > 2) {
            tbody.removeChild(tbody.rows[tbody.rows.length - 1]);
          }
          // 添加提示行
          const tr = doc.createElement('tr');
          const td = doc.createElement('td');
          td.textContent = '... (更多行)';
          td.colSpan = tableClone.rows[0].cells.length;
          td.style.textAlign = 'center';
          td.style.padding = '8px';
          td.style.border = '1px solid #ddd';
          tr.appendChild(td);
          tbody.appendChild(tr);
        }
        
        this.foundTables.push({
          html: tableHTML,
          preview: tableClone.outerHTML
        });
      });
      
      this.tablesFound = true;
      this.exportInfo = `找到 ${tables.length} 个表格，点击"导出表格"按钮将其导出为Excel`;
    },
    exportTableToExcel(tableHtml, fileName) {
      try {
        // 使用浏览器DOM API而不是JSDOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(tableHtml, 'text/html');
        const table = doc.querySelector('table');
        
        if (!table) {
          this.exportInfo = '无效的表格HTML';
          return;
        }
        
        // 提取表格数据
        const data = [];
        const rows = table.querySelectorAll('tr');
        
        rows.forEach(row => {
          const rowData = [];
          const cells = row.querySelectorAll('th, td');
          
          cells.forEach(cell => {
            // 获取单元格文本内容
            rowData.push(cell.textContent.trim());
            
            // 如果需要，还可以获取单元格样式
            // 这里可以添加更多的样式属性
          });
          
          data.push(rowData);
        });
        
        // 创建工作簿
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // 设置列宽（根据第一行的内容长度）
        const colWidths = data[0].map(cell => ({ wch: Math.max(10, cell.length + 2) }));
        ws['!cols'] = colWidths;
        
        // 尝试保留一些表格样式
        // 这里可以添加更多的样式处理，如背景色、字体等
        
        // 将工作表添加到工作簿
        XLSX.utils.book_append_sheet(wb, ws, '表格数据');
        
        // 生成Excel文件并下载
        XLSX.writeFile(wb, `${fileName}.xlsx`);
        
        this.exportInfo = `表格已成功导出为 ${fileName}.xlsx`;
      } catch (error) {
        console.error('导出表格时出错:', error);
        this.exportInfo = `导出表格时出错: ${error.message}`;
      }
    }
  }
};
</script>

<style scoped>
.editor-container {
  border: 1px solid #ccc;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 30px;
}

.editor-header {
  padding: 10px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ccc;
  display: flex;
  gap: 10px;
}

.editor-wrapper {
  height: 400px;
}

.btn {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 8px 16px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 4px;
}

.btn:hover {
  background-color: #45a049;
}

.tables-container {
  margin-top: 20px;
  padding: 15px;
  border-top: 1px solid #eee;
}

.table-item {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.table-preview {
  overflow-x: auto;
  margin-bottom: 10px;
}

.export-btn {
  background-color: #2196F3;
}

.export-btn:hover {
  background-color: #0b7dda;
}

.export-info {
  margin-top: 20px;
  padding: 10px;
  background-color: #e7f3fe;
  border-left: 6px solid #2196F3;
}
</style>
