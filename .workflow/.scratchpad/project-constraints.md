# 项目约束与规范

## 技术约束

### 浏览器支持

- **现代浏览器**：Chrome 90+、Firefox 88+、Safari 14+、Edge 90+
- **不支持**：IE 11 及更早版本
- **原因**：使用 ES6+ 特性、现代 React Hooks

### 文件处理限制

- **最大文件大小**：10 MB
- **支持格式**：.xlsx（推荐）、.xls
- **最大行数**：5000 行（性能考虑）
- **编码**：UTF-8

### Excel 数据格式要求

#### 必填字段

| 字段     | 说明           | 格式示例                  | 验证规则                |
| -------- | -------------- | ------------------------- | ----------------------- |
| 课程名称 | 考试科目       | "数据库系统原理"          | 非空字符串，1-50字符    |
| 考试时间 | 日期和时间范围 | "2026-07-06(12:00-14:00)" | YYYY-MM-DD(HH:mm-HH:mm) |
| 考试地点 | 考场位置       | "13（103-105）"           | 非空字符串，1-100字符   |
| 考试座号 | 座位编号       | "17"                      | 非空字符串              |

#### 可选字段

| 字段     | 说明     | 默认值     |
| -------- | -------- | ---------- |
| 考试名称 | 考试类型 | "期末考试" |

#### 时间格式详细说明

```
标准格式：YYYY-MM-DD(HH:mm-HH:mm)

有效示例：
✅ "2026-07-06(12:00-14:00)"
✅ "2026-01-15(08:30-10:30)"
✅ "2026-12-25(14:00-16:00)"

无效示例：
❌ "2026/07/06(12:00-14:00)"  // 使用了 / 而不是 -
❌ "2026-7-6(12:00-14:00)"    // 月份和日期未补零
❌ "2026-07-06 12:00-14:00"   // 缺少括号
❌ "2026-07-06(12-14)"        // 缺少分钟
```

### ICS 文件规范

#### 文件命名

```
格式：exam-schedule-{timestamp}.ics
示例：exam-schedule-1719388800000.ics
```

#### 日历事件结构

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//期末考试日历导入工具//CN
CALSCALE:GREGORIAN
METHOD:PUBLISH

BEGIN:VEVENT
UID:{unique-id}@exam-schedule
DTSTAMP:{current-timestamp}
DTSTART:{start-datetime}
DTEND:{end-datetime}
SUMMARY:{examName}:{courseName}
DESCRIPTION:座号: {seatNumber}
LOCATION:{location}

BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:提醒: {courseName}{examName}
TRIGGER:-PT{reminderMinutes}M
END:VALARM

END:VEVENT
END:VCALENDAR
```

## 功能约束

### 字段映射规则

#### 自动匹配优先级

```typescript
// 字段名包含匹配（不区分大小写）
const FIELD_PATTERNS = {
  courseName: [
    '课程名称',  // 优先级 1
    '课程',      // 优先级 2
    '科目',      // 优先级 3
    '课程名'     // 优先级 4
  ],
  examName: [
    '考试名称',
    '考试类型',
    '考试',
    '考试类别'
  ],
  examTime: [
    '考试时间',
    '时间',
    '日期时间',
    '考试日期'
  ],
  location: [
    '考试地点',
    '地点',
    '考场',
    '教室'
  ],
  seatNumber: [
    '考试座号',
    '座号',
    '座位号',
    '座位'
  ]
};
```

#### 匹配成功条件

- 必须匹配到至少 4 个必填字段（courseName、examTime、location、seatNumber）
- examName 可选，未匹配时使用默认值"期末考试"

#### 手动映射要求

- 必填字段必须全部映射
- 每个预设字段只能映射一个 Excel 列
- 一个 Excel 列可以不映射（忽略该列）

### 提醒时间配置

#### 全局提醒时间

- **默认值**：60 分钟
- **范围**：0-1440 分钟（0分钟到24小时）
- **预设选项**：15、30、60、120 分钟
- **应用范围**：所有未自定义提醒时间的考试

#### 单个考试提醒时间

- **优先级**：高于全局设置
- **范围**：0-1440 分钟
- **重置操作**：可清除自定义值，恢复使用全局设置

### 数据编辑功能

#### 可编辑字段

- ✅ 课程名称
- ✅ 考试名称
- ✅ 考试地点
- ✅ 考试座号
- ✅ 提醒时间（距离考试开始的间隔）
- ✅ 考试时间（解析并标准化之后，可直接修改）

#### 编辑限制

- 课程名称：1-50字符
- 考试名称：1-50字符
- 考试地点：1-100字符
- 考试座号：1-20字符

#### 删除功能

- 支持单行删除
- 需要确认弹窗
- 至少保留一条考试记录

### 数据验证

#### 上传阶段验证

```typescript
// 文件验证
- 文件类型：application/vnd.openxmlformats-officedocument.spreadsheetml.sheet 或 application/vnd.ms-excel
- 文件大小：<= 10 MB
- 文件内容：至少1行数据（不含表头）

// Excel 结构验证
- 至少包含1个工作表
- 至少包含1行数据
- 列名不能全部为空
```

#### 解析阶段验证

```typescript
// 必填字段验证
- courseName: 非空 && length <= 50
- examTime: 匹配正则 /^\d{4}-\d{2}-\d{2}\(\d{2}:\d{2}-\d{2}:\d{2}\)$/
- location: 非空 && length <= 100
- seatNumber: 非空 && length <= 20

// 时间逻辑验证
- 日期格式有效（Date 对象可解析）
- 结束时间 > 开始时间
- 考试时长：15分钟 - 6小时（提示警告，不阻止）
```

#### 确认阶段验证

```typescript
// 编辑后验证
- 所有必填字段仍然非空
- 字符长度符合限制
- 至少有一条考试记录
```

### 错误处理

#### 错误级别

```typescript
enum ErrorLevel {
  ERROR = 'error',   // 阻止继续操作
  WARNING = 'warning', // 允许继续但需确认
  INFO = 'info'      // 提示信息
}
```

#### 错误提示策略

| 错误类型     | 级别    | 处理方式                         |
| ------------ | ------- | -------------------------------- |
| 文件类型错误 | ERROR   | 阻止上传，显示错误提示           |
| 文件过大     | ERROR   | 阻止上传，显示文件大小           |
| Excel 为空   | ERROR   | 显示错误提示，返回上传步骤       |
| 缺少必填字段 | ERROR   | 显示缺少的字段列表，进入手动映射 |
| 时间格式错误 | ERROR   | 高亮错误行，显示正确格式示例     |
| 考试时长异常 | WARNING | 显示警告，允许继续               |
| 日期已过期   | WARNING | 显示警告，允许继续               |

## UI/UX 约束

### 响应式设计

#### 断点

```css
/* 移动端 */
@media (max-width: 768px) {
  /* 单列布局 */
  /* 简化表格（隐藏部分列） */
  /* 全宽按钮 */
}

/* 平板 */
@media (min-width: 769px) and (max-width: 1024px) {
  /* 两列布局 */
  /* 简化表格 */
}

/* 桌面端 */
@media (min-width: 1025px) {
  /* 完整表格 */
  /* 侧边栏布局（可选） */
}
```

#### 移动端适配

- 文件上传：全屏拖拽区域
- 字段映射：垂直列表布局
- 考试表格：横向滚动 + 固定首列
- 按钮：底部固定工具栏

### 交互规范

#### 步骤导航

- 使用 Ant Design Steps 组件
- 显示当前步骤
- 已完成步骤可点击返回（保留数据）
- 未完成步骤禁用点击

#### 加载状态

```typescript
// 需要显示加载状态的操作
- 文件上传（上传进度条）
- Excel 解析（解析中...）
- ICS 生成（生成中...）
- 文件下载（准备下载...）
```

#### 确认弹窗

```typescript
// 需要确认的操作
- 删除考试记录
- 重新开始（清空所有数据）
- 覆盖已有映射
```

#### 反馈提示

```typescript
// 成功提示（Toast）
- 文件上传成功
- 字段映射完成
- 数据保存成功
- ICS 文件生成成功

// 错误提示（Modal）
- 文件解析失败
- 数据验证失败
- ICS 生成失败
```

### 可访问性（A11y）

#### 键盘导航

- 所有交互元素可 Tab 访问
- 表格支持方向键导航
- 支持 Enter/Space 触发按钮

#### ARIA 标签

```html
<input aria-label="上传 Excel 文件" />
<button aria-label="生成 ICS 文件">生成</button>
<table aria-label="考试信息列表">
```

#### 颜色对比度

- 文字与背景对比度 >= 4.5:1（WCAG AA）
- 错误提示使用明确图标，不仅依赖颜色

## 性能约束

### 性能指标

| 指标                      | 目标值       |
| ------------------------- | ------------ |
| 首屏加载时间              | < 2s         |
| Excel 解析时间（100行）   | < 500ms      |
| Excel 解析时间（1000行）  | < 2s         |
| ICS 生成时间（100场考试） | < 300ms      |
| 表格渲染（1000行）        | 使用虚拟滚动 |

### 优化策略

```typescript
// 1. 代码分割
const ColumnMapper = lazy(() => import('./components/ColumnMapper'));
const ExamTable = lazy(() => import('./components/ExamTable'));

// 2. 防抖优化
const debouncedValidate = debounce(validateData, 300);

// 3. 虚拟滚动（超过100行）
if (exams.length > 100) {
  return <VirtualTable data={exams} />;
}

// 4. Web Worker（超过1000行）
if (data.length > 1000) {
  await parseExcelInWorker(file);
}
```

## 安全约束

### 数据隐私

- ✅ 所有处理在浏览器本地完成
- ✅ 不上传任何数据到服务器
- ✅ 不使用第三方分析服务
- ✅ 不存储用户数据

### 输入安全

```typescript
// XSS 防护
- React 自动转义 HTML
- 用户输入不使用 dangerouslySetInnerHTML

// 文件安全
- 验证文件 MIME 类型
- 限制文件大小
- 捕获解析异常
```

### 依赖安全

```bash
# 定期检查依赖漏洞
npm audit
pnpm audit

# 使用 Dependabot 自动更新
```

## 开发约束

### 代码规范

#### TypeScript 严格模式

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### ESLint 规则

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended"
  ]
}
```

#### 命名规范

```typescript
// 组件：PascalCase
export function FileUploader() {}

// 文件：kebab-case
// file-uploader.tsx

// 函数：camelCase
export function parseExcelFile() {}

// 常量：UPPER_SNAKE_CASE
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 类型/接口：PascalCase
export interface ExamItem {}
```

### Git 规范

#### 分支策略

```
main          # 生产分支
├─ dev        # 开发分支
├─ feature/*  # 功能分支
└─ fix/*      # 修复分支
```

#### Commit 规范

```
feat: 添加文件上传功能
fix: 修复时间解析错误
docs: 更新 README
style: 格式化代码
refactor: 重构字段映射逻辑
test: 添加单元测试
chore: 更新依赖
```

### 测试约束

#### 测试覆盖率目标

- 工具函数：>= 90%
- 组件：>= 70%
- 整体：>= 80%

#### 必须测试的场景

```typescript
// 工具函数
- parseExcelFile: 正常文件、空文件、错误格式
- parseExamTime: 各种时间格式
- generateICS: 单个考试、多个考试、边界情况

// 组件
- FileUploader: 上传成功、上传失败、文件类型错误
- ColumnMapper: 自动匹配、手动映射、验证失败
- ExamTable: 编辑、删除、排序
```

## 部署约束

### 环境变量

```env
# 开发环境
NODE_ENV=development
VITE_APP_TITLE=期末考试日历导入工具（开发版）

# 生产环境
NODE_ENV=production
VITE_APP_TITLE=期末考试日历导入工具
```

### 构建优化

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2015',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'antd': ['antd'],
          'xlsx': ['xlsx'],
          'ics': ['ics'],
        }
      }
    }
  }
});
```

### 静态资源

- 图片压缩：使用 WebP 格式
- 字体子集化：只包含中文常用字
- Gzip/Brotli 压缩

## 兼容性约束

### 已知限制

| 功能         | 浏览器限制          |
| ------------ | ------------------- |
| 文件拖拽上传 | 需要 File API 支持  |
| 本地文件处理 | 需要 FileReader API |
| 日期解析     | 依赖 Date 对象      |
| 文件下载     | 需要 Blob API       |

### Polyfill 策略

- **不使用** Polyfill（目标浏览器均支持所需特性）
- 如需支持旧浏览器，考虑使用 core-js

## 文档约束

### 必须提供的文档

1. **README.md**

   - 项目简介
   - 快速开始
   - 功能列表
   - 技术栈
2. **USER_GUIDE.md**

   - 使用流程
   - 常见问题
   - Excel 格式说明
   - 故障排除
3. **CONTRIBUTING.md**

   - 开发环境搭建
   - 代码规范
   - 提交流程
4. **CHANGELOG.md**

   - 版本历史
   - 功能更新
   - Bug 修复

## 未来扩展约束

### 预留扩展点

```typescript
// 1. 支持更多 Excel 格式
interface ExcelParser {
  parse(file: File): Promise<ParseResult>;
}

// 2. 支持自定义时间格式
interface TimeFormatConfig {
  pattern: string;
  parser: (str: string) => ParsedExamTime;
}

// 3. 支持导出其他格式
interface ExportStrategy {
  generate(exams: ExamItem[]): string;
  download(content: string, filename: string): void;
}
```

### 不实现的功能（MVP 范围外）

- ❌ 用户账号系统
- ❌ 云端存储
- ❌ 多语言支持（仅中文）
- ❌ 主题切换
- ❌ 打印功能
- ❌ 邮件发送
- ❌ 日历同步（直接导入到日历应用）

## 总结

本项目的核心约束：

1. **完全本地化**：无服务器依赖
2. **简单直观**：4步完成转换
3. **灵活适配**：支持不同 Excel 格式
4. **标准兼容**：生成符合 RFC 5545 的 ICS 文件
5. **性能优先**：快速解析和生成
6. **安全第一**：用户数据不离开浏览器
