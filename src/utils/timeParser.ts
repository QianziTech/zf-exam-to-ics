import { parse } from 'date-fns/parse';
import type { ParsedExamTime } from '../types/exam';
import { TIME_FORMAT_REGEX, EXAM_DURATION_LIMITS } from '../constants/fieldMappings';
import { TimeParseError, wrapError } from './errors';

/**
 * 解析考试时间字符串
 * @param timeStr - "2026-07-06(12:00-14:00)" 格式
 * @returns 解析后的时间对象
 * @throws 时间格式错误、时间逻辑错误
 */
export function parseExamTime(timeStr: string): ParsedExamTime {
  // 去除首尾空格
  const trimmed = timeStr.trim();

  // 匹配格式：YYYY-MM-DD(HH:mm-HH:mm)
  const match = trimmed.match(TIME_FORMAT_REGEX);

  if (!match) {
    throw new TimeParseError(
      `时间格式错误: "${timeStr}"。` +
      `正确格式为: YYYY-MM-DD(HH:mm-HH:mm)，例如: 2026-07-06(12:00-14:00)`
    );
  }

  const [, date, startTime, endTime] = match;

  try {
    // 解析开始时间
    const startDateTime = parse(
      `${date} ${startTime}`,
      'yyyy-MM-dd HH:mm',
      new Date()
    );

    // 解析结束时间
    const endDateTime = parse(
      `${date} ${endTime}`,
      'yyyy-MM-dd HH:mm',
      new Date()
    );

    // 验证日期有效性
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      throw new TimeParseError(`日期无效: ${date}`);
    }

    // 验证时间逻辑
    if (endDateTime <= startDateTime) {
      throw new TimeParseError(`结束时间必须晚于开始时间: ${startTime} -> ${endTime}`);
    }

    // 计算考试时长（分钟）
    const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);

    // 验证时长范围
    if (durationMinutes < EXAM_DURATION_LIMITS.min) {
      throw new TimeParseError(
        `考试时长过短（${durationMinutes}分钟），最短应为${EXAM_DURATION_LIMITS.min}分钟`
      );
    }

    if (durationMinutes > EXAM_DURATION_LIMITS.max) {
      throw new TimeParseError(
        `考试时长过长（${durationMinutes}分钟），最长应为${EXAM_DURATION_LIMITS.max}分钟`
      );
    }

    return {
      date,
      startTime,
      endTime,
      startDateTime,
      endDateTime,
    };
  } catch (error) {
    throw wrapError(error, TimeParseError, `时间解析失败: ${timeStr}`);
  }
}

/**
 * 检查考试时长是否异常（显示警告但不阻止）
 * @param parsedTime - 解析后的时间对象
 * @returns 是否异常及警告信息
 */
export function checkExamDuration(parsedTime: ParsedExamTime): {
  isWarning: boolean;
  message?: string;
} {
  const durationMinutes =
    (parsedTime.endDateTime.getTime() - parsedTime.startDateTime.getTime()) / (1000 * 60);

  if (durationMinutes < EXAM_DURATION_LIMITS.warning.min) {
    return {
      isWarning: true,
      message: `考试时长较短（${durationMinutes}分钟），请确认是否正确。`,
    };
  }

  if (durationMinutes > EXAM_DURATION_LIMITS.warning.max) {
    return {
      isWarning: true,
      message: `考试时长较长（${durationMinutes}分钟），请确认是否正确。`,
    };
  }

  return { isWarning: false };
}

/**
 * 检查考试日期是否已过期
 * @param parsedTime - 解析后的时间对象
 * @returns 是否过期及警告信息
 */
export function checkExamDateExpired(parsedTime: ParsedExamTime): {
  isWarning: boolean;
  message?: string;
} {
  const now = new Date();

  if (parsedTime.startDateTime < now) {
    return {
      isWarning: true,
      message: `考试日期已过期（${parsedTime.date}），请确认是否正确。`,
    };
  }

  return { isWarning: false };
}

/**
 * 格式化时间为显示用字符串
 * @param parsedTime - 解析后的时间对象
 * @returns 格式化的字符串，例如 "2026年7月6日 12:00-14:00"
 */
export function formatExamTimeDisplay(parsedTime: ParsedExamTime): string {
  const [year, month, day] = parsedTime.date.split('-');
  return `${year}年${parseInt(month)}月${parseInt(day)}日 ${parsedTime.startTime}-${parsedTime.endTime}`;
}
