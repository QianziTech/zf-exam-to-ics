import { createEvents, type EventAttributes } from 'ics';
import type { ExamItem } from '../types/exam';
import { parseExamTime } from './timeParser';
import { ICSGenerationError, wrapError } from './errors';

/**
 * 生成 ICS 文件内容
 * @param exams - 考试列表
 * @param globalReminderMinutes - 全局提醒时间（分钟）
 * @returns ICS 文件内容字符串
 * @throws ICS 生成失败错误
 */
export function generateICS(
  exams: ExamItem[],
  globalReminderMinutes: number
): string {
  if (exams.length === 0) {
    throw new ICSGenerationError('没有考试数据，无法生成 ICS 文件。');
  }

  const events: EventAttributes[] = exams.map(exam => {
    const { startDateTime, endDateTime } = parseExamTime(exam.examTime);

    // 使用自定义提醒时间，否则使用全局提醒时间
    const reminderMinutes = exam.reminderMinutes ?? globalReminderMinutes;

    return {
      start: [
        startDateTime.getFullYear(),
        startDateTime.getMonth() + 1, // JavaScript 月份从 0 开始
        startDateTime.getDate(),
        startDateTime.getHours(),
        startDateTime.getMinutes(),
      ],
      end: [
        endDateTime.getFullYear(),
        endDateTime.getMonth() + 1,
        endDateTime.getDate(),
        endDateTime.getHours(),
        endDateTime.getMinutes(),
      ],
      title: `${exam.examName}:${exam.courseName}`,
      description: `座号: ${exam.seatNumber}`,
      location: exam.location,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
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
    throw new ICSGenerationError(`生成 ICS 失败: ${error.message}`);
  }

  if (!value) {
    throw new ICSGenerationError('生成 ICS 失败: 返回内容为空。');
  }

  return value;
}

/**
 * 触发浏览器下载 ICS 文件
 * @param icsContent - ICS 文件内容
 * @param filename - 文件名（可选，默认带时间戳）
 */
export function downloadICS(icsContent: string, filename?: string): void {
  const blob = new Blob([icsContent], {
    type: 'text/calendar;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename || `exam-schedule-${Date.now()}.ics`;

  // 触发下载
  document.body.appendChild(link);
  link.click();

  // 清理
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 生成并下载 ICS 文件（组合操作）
 * @param exams - 考试列表
 * @param globalReminderMinutes - 全局提醒时间
 * @param filename - 文件名（可选）
 */
export function generateAndDownloadICS(
  exams: ExamItem[],
  globalReminderMinutes: number,
  filename?: string
): void {
  try {
    const icsContent = generateICS(exams, globalReminderMinutes);
    downloadICS(icsContent, filename);
  } catch (error) {
    throw wrapError(error, ICSGenerationError, '生成并下载 ICS 文件失败');
  }
}
