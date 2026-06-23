import type { ExamItem, ValidationError, ColumnMapping } from '../types/exam';
import { FIELD_LENGTH_LIMITS } from '../constants/fieldMappings';
import { parseExamTime, checkExamDuration, checkExamDateExpired } from './timeParser';

/**
 * 验证单个考试项
 * @param exam - 考试项
 * @param rowIndex - 行索引（用于错误提示）
 * @returns 验证错误列表
 */
export function validateExamItem(exam: ExamItem, rowIndex: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // 验证课程名称
  if (!exam.courseName || exam.courseName.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'courseName',
      message: '课程名称不能为空',
      level: 'error',
    });
  } else if (exam.courseName.length > FIELD_LENGTH_LIMITS.courseName.max) {
    errors.push({
      row: rowIndex,
      field: 'courseName',
      message: `课程名称过长（${exam.courseName.length}字符），最多${FIELD_LENGTH_LIMITS.courseName.max}字符`,
      level: 'error',
    });
  }

  // 验证考试名称
  if (!exam.examName || exam.examName.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'examName',
      message: '考试名称不能为空',
      level: 'error',
    });
  } else if (exam.examName.length > FIELD_LENGTH_LIMITS.examName.max) {
    errors.push({
      row: rowIndex,
      field: 'examName',
      message: `考试名称过长（${exam.examName.length}字符），最多${FIELD_LENGTH_LIMITS.examName.max}字符`,
      level: 'error',
    });
  }

  // 验证考试时间
  if (!exam.examTime || exam.examTime.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'examTime',
      message: '考试时间不能为空',
      level: 'error',
    });
  } else {
    try {
      const parsedTime = parseExamTime(exam.examTime);

      // 检查时长警告
      const durationCheck = checkExamDuration(parsedTime);
      if (durationCheck.isWarning) {
        errors.push({
          row: rowIndex,
          field: 'examTime',
          message: durationCheck.message!,
          level: 'warning',
        });
      }

      // 检查日期过期警告
      const dateCheck = checkExamDateExpired(parsedTime);
      if (dateCheck.isWarning) {
        errors.push({
          row: rowIndex,
          field: 'examTime',
          message: dateCheck.message!,
          level: 'warning',
        });
      }
    } catch (error) {
      errors.push({
        row: rowIndex,
        field: 'examTime',
        message: error instanceof Error ? error.message : '时间格式错误',
        level: 'error',
      });
    }
  }

  // 验证考试地点
  if (!exam.location || exam.location.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'location',
      message: '考试地点不能为空',
      level: 'error',
    });
  } else if (exam.location.length > FIELD_LENGTH_LIMITS.location.max) {
    errors.push({
      row: rowIndex,
      field: 'location',
      message: `考试地点过长（${exam.location.length}字符），最多${FIELD_LENGTH_LIMITS.location.max}字符`,
      level: 'error',
    });
  }

  // 验证考试座号
  if (!exam.seatNumber || exam.seatNumber.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'seatNumber',
      message: '考试座号不能为空',
      level: 'error',
    });
  } else if (exam.seatNumber.length > FIELD_LENGTH_LIMITS.seatNumber.max) {
    errors.push({
      row: rowIndex,
      field: 'seatNumber',
      message: `考试座号过长（${exam.seatNumber.length}字符），最多${FIELD_LENGTH_LIMITS.seatNumber.max}字符`,
      level: 'error',
    });
  }

  return errors;
}

/**
 * 验证考试列表
 * @param exams - 考试列表
 * @returns 验证错误列表
 */
export function validateExamList(exams: ExamItem[]): ValidationError[] {
  if (exams.length === 0) {
    return [{
      row: -1,
      field: 'general',
      message: '至少需要一条考试记录',
      level: 'error',
    }];
  }

  const allErrors: ValidationError[] = [];

  exams.forEach((exam, index) => {
    const errors = validateExamItem(exam, index + 1);
    allErrors.push(...errors);
  });

  return allErrors;
}

/**
 * 从原始数据和列映射创建考试项
 * @param rawData - 原始Excel数据
 * @param mapping - 列映射
 * @param defaultExamName - 全局默认考试名称（当Excel无考试名称列时使用）
 * @returns 考试项列表和验证错误
 */
export function createExamsFromRawData(
  rawData: Record<string, string | number>[],
  mapping: ColumnMapping,
  defaultExamName: string = '期末考试'
): { exams: ExamItem[]; errors: ValidationError[] } {
  const exams: ExamItem[] = [];
  const errors: ValidationError[] = [];

  rawData.forEach((row, index) => {
    try {
      // 读取考试名称
      let examName = defaultExamName;
      let originalExamName: string | undefined = undefined;

      if (mapping.examName) {
        const rawValue = String(row[mapping.examName] || '').trim();
        if (rawValue) {
          examName = rawValue;
          originalExamName = rawValue; // 保存原始值
        } else {
          // Excel有该列但此行为空，使用默认值
          examName = defaultExamName;
        }
      }
      // 如果mapping.examName不存在，使用defaultExamName

      const exam: ExamItem = {
        id: `exam-${Date.now()}-${index}`,
        courseName: mapping.courseName ? String(row[mapping.courseName] || '').trim() : '',
        examName,
        originalExamName,
        examTime: mapping.examTime ? String(row[mapping.examTime] || '').trim() : '',
        location: mapping.location ? String(row[mapping.location] || '').trim() : '',
        seatNumber: mapping.seatNumber ? String(row[mapping.seatNumber] || '').trim() : '',
      };

      // 验证该行数据
      const rowErrors = validateExamItem(exam, index + 1);

      // 只收集错误级别的验证问题
      const criticalErrors = rowErrors.filter(e => e.level === 'error');

      if (criticalErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        // 无严重错误，添加到结果列表
        exams.push(exam);
        // 警告级别的问题也记录
        const warnings = rowErrors.filter(e => e.level === 'warning');
        if (warnings.length > 0) {
          errors.push(...warnings);
        }
      }
    } catch (error) {
      errors.push({
        row: index + 1,
        field: 'general',
        message: error instanceof Error ? error.message : '数据处理失败',
        level: 'error',
      });
    }
  });

  return { exams, errors };
}

/**
 * 按严重程度分组错误
 * @param errors - 验证错误列表
 * @returns 分组后的错误
 */
export function groupErrorsByLevel(errors: ValidationError[]): {
  errors: ValidationError[];
  warnings: ValidationError[];
} {
  return {
    errors: errors.filter(e => e.level === 'error'),
    warnings: errors.filter(e => e.level === 'warning'),
  };
}
