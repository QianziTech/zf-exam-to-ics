import type { ColumnMapping } from '../types/exam';
import { FIELD_PATTERNS, REQUIRED_FIELDS } from '../constants/fieldMappings';

/**
 * 自动匹配 Excel 列名到预设字段
 * @param columns - Excel 列名数组
 * @returns 匹配结果，如果必填字段未全部匹配则返回 null
 */
export function autoMatchColumns(columns: string[]): ColumnMapping | null {
  const mapping: ColumnMapping = {};

  // 遍历每个预设字段
  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    // 尝试匹配每个模式
    for (const col of columns) {
      const matched = patterns.some(pattern =>
        col.trim().includes(pattern)
      );

      if (matched) {
        mapping[field as keyof ColumnMapping] = col;
        break; // 找到匹配后停止该字段的匹配
      }
    }
  }

  // 验证必填字段是否全部匹配
  const matchedRequiredFields = REQUIRED_FIELDS.filter(
    field => mapping[field as keyof ColumnMapping]
  );

  // 必须匹配到所有必填字段
  if (matchedRequiredFields.length < REQUIRED_FIELDS.length) {
    return null;
  }

  return mapping;
}

/**
 * 验证列映射是否完整
 * @param mapping - 列映射对象
 * @returns 缺少的必填字段列表
 */
export function validateColumnMapping(mapping: ColumnMapping): string[] {
  const missingFields: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (!mapping[field as keyof ColumnMapping]) {
      missingFields.push(field);
    }
  }

  return missingFields;
}

/**
 * 获取字段的中文名称
 * @param field - 字段名
 * @returns 中文名称
 */
export function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    courseName: '课程名称',
    examName: '考试名称',
    examTime: '考试时间',
    location: '考试地点',
    seatNumber: '考试座号',
  };
  return labels[field] || field;
}

/**
 * 检查列映射是否存在冲突（一个预设字段映射到多个Excel列）
 * @param mapping - 列映射对象
 * @returns 是否存在冲突
 */
export function hasConflictInMapping(mapping: ColumnMapping): boolean {
  const values = Object.values(mapping).filter(v => v);
  const uniqueValues = new Set(values);
  return values.length !== uniqueValues.size;
}
