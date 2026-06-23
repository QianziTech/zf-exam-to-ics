/**
 * 应用自定义错误基类
 * 用于标识所有来自应用内部的错误
 */
export abstract class AppError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    // 保持原型链正确
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Excel 解析相关错误
 */
export class ExcelParseError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
  }
}

/**
 * 时间解析相关错误
 */
export class TimeParseError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
  }
}

/**
 * 数据验证错误
 */
export class DataValidationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
  }
}

/**
 * ICS 生成错误
 */
export class ICSGenerationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
  }
}

/**
 * 错误装饰器：将未知错误包装为应用错误
 * @param error - 原始错误
 * @param ErrorClass - 目标错误类
 * @param defaultMessage - 默认消息（当 error 不是 Error 实例时）
 * @returns 应用错误实例
 */
export function wrapError<T extends AppError>(
  error: unknown,
  ErrorClass: new (message: string, cause?: unknown) => T,
  defaultMessage: string
): T {
  // 如果已经是目标错误类型，直接返回
  if (error instanceof ErrorClass) {
    return error;
  }

  // 如果是其他应用错误，直接抛出（不包装）
  if (error instanceof AppError) {
    throw error;
  }

  // 如果是标准 Error，包装并保留原始消息
  if (error instanceof Error) {
    return new ErrorClass(`${defaultMessage}: ${error.message}`, error);
  }

  // 非 Error 对象，使用默认消息
  return new ErrorClass(defaultMessage, error);
}

/**
 * 检查错误是否为应用内部错误
 * @param error - 错误对象
 * @returns 是否为应用错误
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
