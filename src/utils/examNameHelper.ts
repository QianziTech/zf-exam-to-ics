import type { ExamItem } from '../types/exam';

/**
 * 分析考试名称分布
 */
export interface ExamNameAnalysis {
  total: number;
  types: Array<{ name: string; count: number; percentage: number }>;
  hasMultipleTypes: boolean;
}

export function analyzeExamNames(exams: ExamItem[]): ExamNameAnalysis {
  const typeCounts = new Map<string, number>();

  exams.forEach((exam) => {
    const count = typeCounts.get(exam.examName) || 0;
    typeCounts.set(exam.examName, count + 1);
  });

  const types = Array.from(typeCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: (count / exams.length) * 100,
    }))
    .sort((a, b) => b.count - a.count); // 按数量降序

  return {
    total: exams.length,
    types,
    hasMultipleTypes: types.length > 1,
  };
}

/**
 * 获取所有唯一的考试名称（按出现次数降序）
 */
export function getUniqueExamNames(exams: ExamItem[]): string[] {
  const analysis = analyzeExamNames(exams);
  return analysis.types.map((t) => t.name);
}

/**
 * 根据考试名称筛选
 */
export function filterExamsByNames(
  exams: ExamItem[],
  selectedNames: string[]
): ExamItem[] {
  if (selectedNames.length === 0) {
    return exams;
  }
  return exams.filter((exam) => selectedNames.includes(exam.examName));
}

/**
 * 检查考试名称是否有效
 */
export function isValidExamName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 50;
}

/**
 * 格式化考试名称统计信息
 */
export function formatExamNameSummary(analysis: ExamNameAnalysis): string {
  if (analysis.types.length === 0) {
    return '无考试数据';
  }

  if (analysis.types.length === 1) {
    return `全部为"${analysis.types[0].name}"`;
  }

  return analysis.types
    .map((t) => `${t.name}(${t.count}场)`)
    .join('、');
}
