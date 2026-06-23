/**
 * 预设字段名称映射规则
 * 按优先级排序，优先匹配前面的模式
 */
export const FIELD_PATTERNS = {
  courseName: ['课程名称', '课程', '科目', '课程名'],
  examName: ['考试名称', '考试类型', '考试类别'],
  examTime: ['考试时间', '时间', '日期时间', '考试日期'],
  location: ['考试地点', '地点', '考场', '教室'],
  seatNumber: ['考试座号', '座号', '座位号', '座位'],
} as const;

/**
 * 必填字段列表
 */
export const REQUIRED_FIELDS = ['courseName', 'examTime', 'location', 'seatNumber'] as const;

/**
 * 可选字段列表
 */
export const OPTIONAL_FIELDS = ['examName'] as const;

/**
 * 字段默认值
 */
export const FIELD_DEFAULTS = {
  examName: '期末考试',
} as const;

/**
 * 字段长度限制
 */
export const FIELD_LENGTH_LIMITS = {
  courseName: { min: 1, max: 50 },
  examName: { min: 1, max: 50 },
  location: { min: 1, max: 100 },
  seatNumber: { min: 1, max: 20 },
} as const;

/**
 * 文件限制
 */
export const FILE_CONSTRAINTS = {
  maxSize: 10 * 1024 * 1024, // 10 MB
  maxRows: 5000,
  allowedTypes: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ],
  allowedExtensions: ['.xlsx', '.xls'],
} as const;

/**
 * 提醒时间配置
 */
export const REMINDER_CONFIG = {
  default: 60, // 默认60分钟
  min: 0,
  max: 1440, // 24小时
  presets: [15, 30, 60, 120], // 预设选项
} as const;

/**
 * 时间格式正则
 */
export const TIME_FORMAT_REGEX = /^(\d{4}-\d{2}-\d{2})\((\d{2}:\d{2})-(\d{2}:\d{2})\)$/;

/**
 * 考试时长限制（分钟）
 */
export const EXAM_DURATION_LIMITS = {
  min: 15,    // 最短15分钟
  max: 360,   // 最长6小时
  warning: {  // 超出此范围显示警告
    min: 30,
    max: 240, // 4小时
  },
} as const;
