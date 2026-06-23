# 考试日历导入工具 - 实施计划

## 项目概述

将原 Python + Tkinter 桌面应用改造为 React 单页应用，实现从教务系统导出的 Excel 文件生成可导入日历软件的 ICS 文件。

## 用户流程设计

```
┌─────────────────────────────────────────────────────────────┐
│                     第一步：文件上传                          │
│  - 仅接受 .xlsx/.xls 格式                                    │
│  - 拖拽或点击上传                                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   第二步：智能解析                            │
│  - 预设字段自动匹配：课程名称、考试名称、考试时间、          │
│    考试地点、考试座号                                         │
│  - 匹配失败 → 显示 Excel 所有列供用户手动映射                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 第三步：信息确认与编辑                        │
│  - 表格形式展示所有考试信息                                   │
│  - 支持单个考试自定义提前提醒时间（默认60分钟）              │
│  - 支持直接编辑课程名称、地点、座号等信息                     │
│  - 全局提醒时间设置（应用到所有未自定义的考试）              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  第四步：生成与下载                           │
│  - 点击"生成 ICS"按钮                                        │
│  - 自动触发浏览器下载（带时间戳的文件名）                     │
└─────────────────────────────────────────────────────────────┘
```

## 数据模型设计

### ExamItem 接口

```typescript
export interface ExamItem {
  id: string;              // 唯一标识符
  courseName: string;      // 课程名称
  examName: string;        // 考试名称（从Excel读取或默认"期末考试"）
  examTime: string;        // 原始时间字符串 "2026-07-06(12:00-14:00)"
  location: string;        // 考试地点
  seatNumber: string;      // 考试座号
  reminderMinutes?: number; // 自定义提醒时间（可选，未设置则使用全局）
}

export interface ParsedExamTime {
  date: string;            // "2026-07-06"
  startTime: string;       // "12:00"
  endTime: string;         // "14:00"
  startDateTime: Date;     // 完整开始时间对象
  endDateTime: Date;       // 完整结束时间对象
}

export interface ColumnMapping {
  courseName?: string;     // Excel列名 -> courseName
  examName?: string;       // Excel列名 -> examName
  examTime?: string;       // Excel列名 -> examTime
  location?: string;       // Excel列名 -> location
  seatNumber?: string;     // Excel列名 -> seatNumber
}
```

### Store 状态设计

```typescript
export interface ExamState {
  // 数据状态
  exams: ExamItem[];
  rawExcelData: any[] | null;        // 原始Excel数据
  excelColumns: string[] | null;     // Excel列名列表
  
  // UI 状态
  step: 'upload' | 'mapping' | 'confirm' | 'download';
  columnMapping: ColumnMapping | null;
  globalReminderMinutes: number;     // 全局默认60分钟
  
  // Actions
  setRawExcelData: (data: any[], columns: string[]) => void;
  setColumnMapping: (mapping: ColumnMapping) => void;
  setExams: (exams: ExamItem[]) => void;
  updateExam: (id: string, updates: Partial<ExamItem>) => void;
  setGlobalReminderMinutes: (minutes: number) => void;
  setStep: (step: ExamState['step']) => void;
  reset: () => void;
}
```

## 技术栈与依赖

### 核心依赖

```json
{
  "dependencies": {
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "xlsx": "^0.18.5",          // Excel 解析
    "ics": "^3.7.2",            // ICS 生成
    "date-fns": "^4.1.0",       // 日期处理
    "antd": "^5.22.2",          // UI 组件库
    "zustand": "^5.0.2",        // 状态管理
    "@ant-design/icons": "^5.5.1", // Ant Design 图标
    "nanoid": "^5.0.9"          // 生成唯一ID
  }
}
```

### 为什么选择这些库？

- **xlsx**: SheetJS 是业界标准，支持浏览器环境，无需后端
- **ics**: 轻量级 ICS 生成库，API 简洁
- **date-fns**: 现代化日期处理，tree-shakeable，比 moment.js 轻量
- **antd**: 成熟的 UI 组件库，开箱即用的表格、上传、表单组件
- **zustand**: 比 Redux 更轻量，API 简单，适合中小型项目

## 目录结构

```
src/
├── components/
│   ├── FileUploader/
│   │   ├── index.tsx              # 文件上传组件
│   │   └── styles.module.css
│   ├── ColumnMapper/
│   │   ├── index.tsx              # 字段映射组件
│   │   └── styles.module.css
│   ├── ExamTable/
│   │   ├── index.tsx              # 考试信息表格（可编辑）
│   │   └── styles.module.css
│   ├── ReminderConfig/
│   │   ├── index.tsx              # 提醒时间配置
│   │   └── styles.module.css
│   └── DownloadButton/
│       └── index.tsx              # ICS 生成与下载
├── utils/
│   ├── excelParser.ts             # Excel 解析逻辑
│   ├── icsGenerator.ts            # ICS 生成逻辑
│   ├── timeParser.ts              # 时间字符串解析
│   ├── columnMatcher.ts           # 智能列名匹配
│   └── validator.ts               # 数据验证
├── stores/
│   └── examStore.ts               # Zustand 状态管理
├── types/
│   └── exam.ts                    # 类型定义
├── constants/
│   └── fieldMappings.ts           # 预设字段映射规则
├── App.tsx                         # 主应用
├── App.css                         # 全局样式
└── main.tsx                        # 入口文件
```

## 核心功能实现细节

### 1. Excel 解析 (`utils/excelParser.ts`)

```typescript
/**
 * 解析 Excel 文件
 * @param file - Excel 文件对象
 * @returns 原始数据数组和列名数组
 */
export async function parseExcelFile(
  file: File
): Promise<{ data: any[]; columns: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  if (jsonData.length === 0) {
    throw new Error('Excel 文件为空');
  }
  
  const columns = Object.keys(jsonData[0]);
  return { data: jsonData, columns };
}
```

### 2. 智能字段匹配 (`utils/columnMatcher.ts`)

```typescript
/**
 * 预设字段名称映射规则
 */
const FIELD_PATTERNS = {
  courseName: ['课程名称', '课程', '科目', '课程名'],
  examName: ['考试名称', '考试类型', '考试', '考试类别'],
  examTime: ['考试时间', '时间', '日期时间', '考试日期'],
  location: ['考试地点', '地点', '考场', '教室'],
  seatNumber: ['考试座号', '座号', '座位号', '座位'],
};

/**
 * 自动匹配 Excel 列名到预设字段
 * @param columns - Excel 列名数组
 * @returns 匹配结果或 null
 */
export function autoMatchColumns(
  columns: string[]
): ColumnMapping | null {
  const mapping: ColumnMapping = {};
  let matchCount = 0;

  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const col of columns) {
      if (patterns.some(pattern => col.includes(pattern))) {
        mapping[field as keyof ColumnMapping] = col;
        matchCount++;
        break;
      }
    }
  }

  // 必须匹配到至少 4 个字段（除了 examName 可选）
  const requiredFields = ['courseName', 'examTime', 'location', 'seatNumber'];
  const matchedRequired = requiredFields.filter(
    field => mapping[field as keyof ColumnMapping]
  );

  return matchedRequired.length >= 4 ? mapping : null;
}
```

### 3. 时间解析 (`utils/timeParser.ts`)

```typescript
import { parse, format } from 'date-fns';

/**
 * 解析考试时间字符串
 * @param timeStr - "2026-07-06(12:00-14:00)" 格式
 * @returns 解析后的时间对象
 */
export function parseExamTime(timeStr: string): ParsedExamTime {
  // 匹配格式：YYYY-MM-DD(HH:mm-HH:mm)
  const match = timeStr.match(/^(\d{4}-\d{2}-\d{2})\((\d{2}:\d{2})-(\d{2}:\d{2})\)$/);
  
  if (!match) {
    throw new Error(`无效的时间格式: ${timeStr}`);
  }

  const [, date, startTime, endTime] = match;
  
  const startDateTime = parse(
    `${date} ${startTime}`,
    'yyyy-MM-dd HH:mm',
    new Date()
  );
  const endDateTime = parse(
    `${date} ${endTime}`,
    'yyyy-MM-dd HH:mm',
    new Date()
  );

  return {
    date,
    startTime,
    endTime,
    startDateTime,
    endDateTime,
  };
}
```

### 4. ICS 生成 (`utils/icsGenerator.ts`)

```typescript
import { createEvents, EventAttributes } from 'ics';
import { parseExamTime } from './timeParser';

/**
 * 生成 ICS 文件内容
 * @param exams - 考试列表
 * @param globalReminderMinutes - 全局提醒时间
 * @returns ICS 文件内容字符串
 */
export function generateICS(
  exams: ExamItem[],
  globalReminderMinutes: number
): string {
  const events: EventAttributes[] = exams.map(exam => {
    const { startDateTime, endDateTime } = parseExamTime(exam.examTime);
  
    const reminderMinutes = exam.reminderMinutes ?? globalReminderMinutes;
  
    return {
      start: [
        startDateTime.getFullYear(),
        startDateTime.getMonth() + 1,
        startDateTime.getDate(),
        startDateTime.getHours(),
        startDateTime.getMinutes()
      ],
      end: [
        endDateTime.getFullYear(),
        endDateTime.getMonth() + 1,
        endDateTime.getDate(),
        endDateTime.getHours(),
        endDateTime.getMinutes()
      ],
      title: `${exam.examName}:${exam.courseName}`,
      description: `座号: ${exam.seatNumber}`,
      location: exam.location,
      alarms: [
        {
          action: 'display',
          description: `提醒: ${exam.courseName}${exam.examName}`,
          trigger: { minutes: reminderMinutes, before: true },
        },
      ],
    };
  });

  const { error, value } = createEvents(events);
  
  if (error) {
    throw new Error(`生成 ICS 失败: ${error.message}`);
  }

  return value!;
}

/**
 * 触发浏览器下载 ICS 文件
 * @param icsContent - ICS 文件内容
 * @param filename - 文件名（可选）
 */
export function downloadICS(icsContent: string, filename?: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename || `exam-schedule-${Date.now()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

## UI 组件设计

### 1. FileUploader 组件

```typescript
// 功能：
// - 拖拽上传
// - 点击上传
// - 限制文件类型（.xlsx, .xls）
// - 文件大小限制（建议 10MB）
// - 上传进度显示
// - 错误提示

// 使用 Ant Design Upload 组件
```

### 2. ColumnMapper 组件

```typescript
// 功能：
// - 左侧显示 Excel 列名列表
// - 右侧显示必填字段（课程名称、考试时间、地点、座号）和可选字段（考试名称）
// - 拖拽或下拉选择映射关系
// - 实时验证必填字段是否完整
// - 显示映射预览（前3行数据）

// 使用 Ant Design Select、Tag 组件
```

### 3. ExamTable 组件

```typescript
// 功能：
// - 可编辑表格
// - 列：课程名称、考试名称、考试时间、地点、座号、提醒时间
// - 支持单元格编辑
// - 支持行删除
// - 支持排序（按时间）
// - 显示统计信息（总计 X 场考试）

// 使用 Ant Design Table（editable）
```

### 4. ReminderConfig 组件

```typescript
// 功能：
// - 全局提醒时间设置（滑块 + 输入框）
// - 范围：0-1440 分钟（0分钟到24小时）
// - 预设选项：15、30、60、120 分钟
// - 显示效果预览："将在考试开始前 XX 分钟提醒"

// 使用 Ant Design Slider、InputNumber
```

### 5. DownloadButton 组件

```typescript
// 功能：
// - 生成 ICS 并下载
// - 加载状态显示
// - 成功提示
// - 错误处理

// 使用 Ant Design Button
```

## 页面布局设计

```typescript
// App.tsx 结构
<Layout>
  <Header>
    <h1>期末考试日历导入工具</h1>
    <Steps current={stepIndex}>
      <Step title="上传文件" />
      <Step title="字段映射" />
      <Step title="确认信息" />
      <Step title="下载文件" />
    </Steps>
  </Header>
  
  <Content>
    {step === 'upload' && <FileUploader />}
    {step === 'mapping' && <ColumnMapper />}
    {step === 'confirm' && (
      <>
        <ReminderConfig />
        <ExamTable />
      </>
    )}
    {step === 'download' && <DownloadButton />}
  </Content>
  
  <Footer>
    <Space>
      {step !== 'upload' && <Button onClick={handlePrev}>上一步</Button>}
      {step !== 'download' && <Button type="primary" onClick={handleNext}>下一步</Button>}
      <Button onClick={handleReset}>重新开始</Button>
    </Space>
  </Footer>
</Layout>
```

## 数据验证规则

### Excel 数据验证

```typescript
export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

// 验证规则：
// 1. 课程名称：非空字符串
// 2. 考试时间：匹配 YYYY-MM-DD(HH:mm-HH:mm) 格式
// 3. 考试地点：非空字符串
// 4. 考试座号：非空字符串
// 5. 考试名称：可选，默认"期末考试"
```

### 时间验证

```typescript
// 1. 日期不能早于今天
// 2. 结束时间必须晚于开始时间
// 3. 考试时长合理性（建议 0.5-4 小时）
```

## 错误处理策略

### 文件上传错误

- 文件类型错误：提示只能上传 .xlsx 或 .xls 文件
- 文件过大：提示文件大小超限
- 文件损坏：提示文件无法解析

### 解析错误

- Excel 为空：提示文件内容为空
- 缺少必填列：提示缺少哪些字段
- 数据格式错误：高亮显示错误行，提示具体问题

### 生成错误

- 时间解析失败：提示具体哪行数据有问题
- ICS 生成失败：提示错误原因

## 性能优化

1. **大文件处理**

   - 使用 Web Worker 解析 Excel（如果超过 1000 行）
   - 虚拟滚动表格（react-window）
2. **状态管理优化**

   - 使用 Zustand 的选择器避免不必要的重渲染
   - 表格编辑使用防抖
3. **打包优化**

   - 代码分割（React.lazy）
   - Tree-shaking
   - Gzip 压缩

## 测试策略

### 单元测试

- Excel 解析函数
- 时间解析函数
- ICS 生成函数
- 字段匹配函数

### 集成测试

- 完整流程测试（上传 → 映射 → 确认 → 下载）
- 边界情况测试（空文件、大文件、错误格式）

### 手动测试

- 使用原项目的真实 Excel 文件测试
- 生成的 ICS 文件导入到多个日历应用验证

## 部署方案

### 开发环境

```bash
npm run dev
# 或
pnpm dev
```

### 生产构建

```bash
npm run build
pnpm build
```

### 部署选项

**静态托管**

- Vercel
- Netlify
- GitHub Pages

## 项目时间表

| 阶段           | 任务                             | 预计时间            |
| -------------- | -------------------------------- | ------------------- |
| 1              | 依赖安装与环境配置               | 30分钟              |
| 2              | 类型定义与常量配置               | 30分钟              |
| 3              | 工具函数实现（Excel、时间、ICS） | 2小时               |
| 4              | Zustand Store 实现               | 1小时               |
| 5              | 文件上传组件                     | 1小时               |
| 6              | 字段映射组件                     | 2小时               |
| 7              | 可编辑表格组件                   | 2小时               |
| 8              | 提醒配置组件                     | 1小时               |
| 9              | 下载按钮组件                     | 30分钟              |
| 10             | 主应用集成                       | 1小时               |
| 11             | 样式调整与响应式                 | 2小时               |
| 12             | 测试与 Bug 修复                  | 2小时               |
| **总计** |                                  | **15-16小时** |

## 风险与挑战

### 技术风险

1. **Excel 格式多样性**

   - 缓解：提供灵活的字段映射界面
   - 测试多种教务系统导出格式
2. **时间格式解析**

   - 缓解：支持多种时间格式
   - 提供时间格式帮助文档
3. **ICS 兼容性**

   - 缓解：遵循 RFC 5545 标准
   - 在多个日历应用中测试

### 用户体验风险

1. **操作复杂度**

   - 缓解：提供引导式步骤
   - 智能默认配置
2. **错误提示不清晰**

   - 缓解：友好的错误提示
   - 提供示例和帮助文档

## 下一步行动

1. ✅ 完成需求分析和架构设计
2. ⏳ 安装项目依赖
3. ⏳ 实现工具函数层
4. ⏳ 实现状态管理
5. ⏳ 实现 UI 组件
6. ⏳ 集成测试
7. ⏳ 部署上线
