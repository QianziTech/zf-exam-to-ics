// 考试信息项
export interface ExamItem {
  id: string;              // 唯一标识符
  courseName: string;      // 课程名称
  examName: string;        // 考试名称（从Excel读取或默认"期末考试"）
  examTime: string;        // 原始时间字符串 "2026-07-06(12:00-14:00)"
  location: string;        // 考试地点
  seatNumber: string;      // 考试座号
  reminderMinutes?: number; // 自定义提醒时间（可选，未设置则使用全局）
}

// 解析后的考试时间
export interface ParsedExamTime {
  date: string;            // "2026-07-06"
  startTime: string;       // "12:00"
  endTime: string;         // "14:00"
  startDateTime: Date;     // 完整开始时间对象
  endDateTime: Date;       // 完整结束时间对象
}

// 列名映射配置
export interface ColumnMapping {
  courseName?: string;     // Excel列名 -> courseName
  examName?: string;       // Excel列名 -> examName
  examTime?: string;       // Excel列名 -> examTime
  location?: string;       // Excel列名 -> location
  seatNumber?: string;     // Excel列名 -> seatNumber
}

// 应用状态
export interface ExamState {
  // 数据状态
  exams: ExamItem[];
  rawExcelData: Record<string, string | number>[] | null;        // 原始Excel数据
  excelColumns: string[] | null;     // Excel列名列表

  // UI 状态
  step: 'upload' | 'mapping' | 'confirm' | 'download';
  columnMapping: ColumnMapping | null;
  globalReminderMinutes: number;     // 全局默认60分钟

  // Actions
  setRawExcelData: (data: Record<string, string | number>[], columns: string[]) => void;
  setColumnMapping: (mapping: ColumnMapping) => void;
  setExams: (exams: ExamItem[]) => void;
  updateExam: (id: string, updates: Partial<ExamItem>) => void;
  deleteExam: (id: string) => void;
  setGlobalReminderMinutes: (minutes: number) => void;
  setStep: (step: ExamState['step']) => void;
  reset: () => void;
}

// 验证错误
export interface ValidationError {
  row: number;
  field: string;
  message: string;
  level: 'error' | 'warning';
}
