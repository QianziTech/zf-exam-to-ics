import React, { useState } from 'react';
import { Upload, message, Spin } from 'antd';
import { InboxOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useExamStore } from '../../stores/examStore';
import { parseExcelFile } from '../../utils/excelParser';
import { autoMatchColumns } from '../../utils/columnMatcher';
import { createExamsFromRawData } from '../../utils/validator';

const { Dragger } = Upload;

export const FileUploader: React.FC = () => {
  const {
    setRawExcelData,
    setColumnMapping,
    setExams,
    setStep,
    defaultExamName,
  } = useExamStore();
  const [loading, setLoading] = useState(false);

  const handleCustomRequest = async (options: {
    file: File | Blob | string;
    onSuccess?: (response: unknown) => void;
    onError?: (error: Error) => void;
    onProgress?: (event: { percent: number }) => void;
  }) => {
    const { file, onSuccess, onError } = options;
    setLoading(true);
    try {
      const result = await parseExcelFile(file as File);
      setRawExcelData(result.data, result.columns);
      onSuccess?.(result);
      message.success('文件解析成功！');

      // 尝试智能自动匹配列
      const matchedMapping = autoMatchColumns(result.columns);
      if (matchedMapping) {
        setColumnMapping(matchedMapping);
        
        // 自动提取考试项
        const { exams, errors } = createExamsFromRawData(
          result.data,
          matchedMapping,
          defaultExamName
        );
        
        // 如果有严重错误（criticalErrors）则我们进入映射或确认页。
        // 一般来说，既然自动匹配成功了，我们可以前往确认页展示数据，让用户可以修补错误。
        setExams(exams);
        const criticalErrors = errors.filter(e => e.level === 'error');
        if (criticalErrors.length === 0) {
          message.success(`智能匹配成功，自动匹配所有列并加载 ${exams.length} 场考试。`);
        } else {
          message.warning(`智能匹配成功，但检测到部分数据格式有误，请进行修正。`);
        }
        setStep('confirm');
      } else {
        message.info('未完全自动匹配到所有必填列，请手动建立映射关系。');
        setStep('mapping');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('文件解析失败，请检查文件格式。');
      onError?.(error);
      message.error(error.message || '文件解析失败，请检查文件格式。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="file-uploader-container">
      <Spin spinning={loading} tip="正在读取并解析 Excel 文件...">
        <div className="uploader-card">
          <div className="notebook-spine">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="spine-hole" />
            ))}
          </div>
          
          <div className="uploader-content">
            <div className="submit-bag-title">
              <span className="serif-step">01</span>
              <span className="step-name">/ 提交考试安排表</span>
            </div>
            
            <Dragger
              name="file"
              multiple={false}
              showUploadList={false}
              accept=".xlsx,.xls"
              customRequest={handleCustomRequest}
              disabled={loading}
              className="custom-dragger"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined className="upload-icon-inbox" />
              </p>
              <p className="ant-upload-text">将教务系统导出的考试安排表拖拽到这里</p>
              <p className="ant-upload-hint">或点击此处选择本地文件</p>
              <div className="excel-tag">
                <FileExcelOutlined style={{ marginRight: 6 }} />
                支持 .xlsx / .xls 格式
              </div>
            </Dragger>
            
            <div className="security-notice">
              <p className="notice-text">
                🔒 所有数据均在<strong>本地浏览器中解析与处理</strong>，绝不会上传至任何服务器，保障您的信息安全与隐私。
              </p>
            </div>
          </div>
        </div>
      </Spin>
    </div>
  );
};
