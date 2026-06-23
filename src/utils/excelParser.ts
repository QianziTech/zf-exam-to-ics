import * as XLSX from 'xlsx';
import { FILE_CONSTRAINTS } from '../constants/fieldMappings';
import { ExcelParseError, wrapError } from './errors';

/**
 * Excel 解析结果
 */
export interface ExcelParseResult {
  data: Record<string, string | number>[];
  columns: string[];
}

/**
 * 解析 Excel 文件
 * @param file - Excel 文件对象
 * @returns 原始数据数组和列名数组
 * @throws 文件类型错误、文件过大、文件为空等错误
 */
export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  // 验证文件类型
  const isValidMimeType = FILE_CONSTRAINTS.allowedTypes.includes(
    file.type as typeof FILE_CONSTRAINTS.allowedTypes[number]
  );

  if (!isValidMimeType) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const extWithDot = extension ? `.${extension}` : '';
    const isValidExtension = FILE_CONSTRAINTS.allowedExtensions.includes(
      extWithDot as typeof FILE_CONSTRAINTS.allowedExtensions[number]
    );

    if (!isValidExtension) {
      throw new ExcelParseError(
        `不支持的文件类型。请上传 ${FILE_CONSTRAINTS.allowedExtensions.join(' 或 ')} 格式的文件。`
      );
    }
  }

  // 验证文件大小
  if (file.size > FILE_CONSTRAINTS.maxSize) {
    const maxSizeMB = FILE_CONSTRAINTS.maxSize / (1024 * 1024);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new ExcelParseError(
      `文件大小超限。当前文件 ${fileSizeMB} MB，最大允许 ${maxSizeMB} MB。`
    );
  }

  try {
    // 读取文件
    const arrayBuffer = await file.arrayBuffer();

    // 解析工作簿
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // 获取第一个工作表
    if (workbook.SheetNames.length === 0) {
      throw new ExcelParseError('Excel 文件中没有工作表。');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // 转换为 JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false, // 将日期等格式化为字符串
      defval: '', // 空单元格默认为空字符串
    });

    // 验证数据不为空
    if (jsonData.length === 0) {
      throw new ExcelParseError('Excel 文件中没有数据行（需要至少1行数据，不包括表头）。');
    }

    // 验证行数限制
    if (jsonData.length > FILE_CONSTRAINTS.maxRows) {
      throw new ExcelParseError(
        `数据行数超限。当前 ${jsonData.length} 行，最大允许 ${FILE_CONSTRAINTS.maxRows} 行。`
      );
    }

    // 提取列名
    const firstRow = jsonData[0] as Record<string, unknown>;
    const columns = Object.keys(firstRow).filter(col => col.trim() !== '');

    if (columns.length === 0) {
      throw new ExcelParseError('Excel 文件中没有有效的列名。');
    }

    return {
      data: jsonData as Record<string, string | number>[],
      columns
    };
  } catch (error) {
    throw wrapError(error, ExcelParseError, 'Excel 文件解析失败');
  }
}

/**
 * 验证文件扩展名
 * @param filename - 文件名
 * @returns 是否为有效的 Excel 文件
 */
export function isValidExcelFile(filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return false;

  const extWithDot = `.${extension}` as typeof FILE_CONSTRAINTS.allowedExtensions[number];
  return FILE_CONSTRAINTS.allowedExtensions.includes(extWithDot);
}
