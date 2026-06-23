import React, { useState } from 'react';
import { Select, Button, Input, Table, Alert, message, Form, Space } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useExamStore } from '../../stores/examStore';
import { validateColumnMapping, getFieldLabel } from '../../utils/columnMatcher';
import { createExamsFromRawData } from '../../utils/validator';
import { REQUIRED_FIELDS } from '../../constants/fieldMappings';
import type { ColumnMapping } from '../../types/exam';

export const ColumnMapper: React.FC = () => {
  const {
    rawExcelData,
    excelColumns,
    columnMapping,
    defaultExamName,
    setColumnMapping,
    setDefaultExamName,
    setExams,
    setStep,
  } = useExamStore();

  const [mapping, setMapping] = useState<ColumnMapping>(() => columnMapping || {});
  const [localDefaultExamName, setLocalDefaultExamName] = useState(defaultExamName);

  // 修改单个字段的映射
  const handleFieldChange = (field: keyof ColumnMapping, excelColumn: string | undefined) => {
    const nextMapping = { ...mapping, [field]: excelColumn };
    // 清空空字符串
    if (!excelColumn) {
      delete nextMapping[field];
    }
    setMapping(nextMapping);
  };

  // 检查是否所有必填字段都已映射
  const missingFields = validateColumnMapping(mapping);
  const isValid = missingFields.length === 0;

  // 检查映射冲突 (防止不同的目标字段绑定同一个Excel列)
  const mappedValues = Object.entries(mapping)
    .filter((entry) => !!entry[1])
    .map((entry) => entry[1]);
  const hasConflict = mappedValues.length !== new Set(mappedValues).size;

  // 保存并继续
  const handleNext = () => {
    if (!rawExcelData) return;

    if (!isValid) {
      message.error(`请映射所有必填字段：${missingFields.map(getFieldLabel).join(', ')}`);
      return;
    }

    if (hasConflict) {
      message.error('映射关系冲突：同一个 Excel 列不能映射到多个字段！');
      return;
    }

    // 更新 store
    setColumnMapping(mapping);
    setDefaultExamName(localDefaultExamName);

    // 生成数据
    const { exams, errors } = createExamsFromRawData(
      rawExcelData,
      mapping,
      localDefaultExamName
    );

    setExams(exams);

    const criticalErrors = errors.filter((e) => e.level === 'error');
    if (criticalErrors.length === 0) {
      message.success(`映射完成，已解析 ${exams.length} 场考试。`);
    } else {
      message.warning(`解析完成，但有 ${criticalErrors.length} 条数据存在错误，请在列表中修改。`);
    }

    setStep('confirm');
  };

  // 生成预览数据
  const getPreviewData = () => {
    if (!rawExcelData || rawExcelData.length === 0) return [];
    
    // 只展示前3行数据
    const previewRows = rawExcelData.slice(0, 3);
    
    return previewRows.map((row, idx) => {
      const courseName = mapping.courseName ? String(row[mapping.courseName] || '') : '—';
      const examName = mapping.examName 
        ? (String(row[mapping.examName] || '') || localDefaultExamName) 
        : localDefaultExamName;
      const examTime = mapping.examTime ? String(row[mapping.examTime] || '') : '—';
      const location = mapping.location ? String(row[mapping.location] || '') : '—';
      const seatNumber = mapping.seatNumber ? String(row[mapping.seatNumber] || '') : '—';

      return {
        key: idx,
        rowNum: idx + 1,
        courseName,
        examName,
        examTime,
        location,
        seatNumber,
      };
    });
  };

  const previewColumns = [
    { title: 'Excel 行', dataIndex: 'rowNum', key: 'rowNum', width: 80 },
    { title: '课程名称', dataIndex: 'courseName', key: 'courseName' },
    { title: '考试名称', dataIndex: 'examName', key: 'examName' },
    { title: '考试时间', dataIndex: 'examTime', key: 'examTime' },
    { title: '地点', dataIndex: 'location', key: 'location' },
    { title: '座号', dataIndex: 'seatNumber', key: 'seatNumber' },
  ];

  return (
    <div className="column-mapper-container">
      <div className="uploader-card">
        {/* 书页穿孔效果 */}
        <div className="notebook-spine">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="spine-hole" />
          ))}
        </div>

        <div className="uploader-content">
          <div className="submit-bag-title">
            <span className="serif-step">02</span>
            <span className="step-name">/ 字段映射设置</span>
          </div>

          <p className="mapper-intro">
            请建立您的 Excel 表头与系统所需字段之间的对应关系。系统已为您自动尝试智能匹配。
          </p>

          <Form layout="vertical" className="mapper-form">
            <h3 className="section-title">📌 必填核心字段</h3>
            <div className="fields-grid">
              {REQUIRED_FIELDS.map((field) => (
                <Form.Item
                  key={field}
                  label={
                    <span className="field-label-text">
                      {getFieldLabel(field)} <span className="required-star">*</span>
                    </span>
                  }
                  validateStatus={!mapping[field] ? 'warning' : undefined}
                >
                  <Select
                    placeholder={`请选择对应的 Excel 列`}
                    value={mapping[field]}
                    onChange={(val) => handleFieldChange(field, val)}
                    allowClear
                    className="custom-select"
                  >
                    {excelColumns?.map((col) => (
                      <Select.Option key={col} value={col}>
                        {col}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              ))}
            </div>

            <h3 className="section-title" style={{ marginTop: '24px' }}>✏️ 可选与默认配置</h3>
            <div className="optional-fields-container">
              <Form.Item
                label={<span className="field-label-text">考试名称映射列</span>}
                help="如果您的 Excel 中有一列明确标识了考试类型（如期末考试、期中考试、补考等），请在此处选择它。"
              >
                <Select
                  placeholder="未匹配 (使用默认值)"
                  value={mapping.examName}
                  onChange={(val) => handleFieldChange('examName', val)}
                  allowClear
                  className="custom-select"
                >
                  {excelColumns?.map((col) => (
                    <Select.Option key={col} value={col}>
                      {col}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              {/* 当没有映射考试名称列时，或者映射了但用户也想自定义全局默认值 */}
              {!mapping.examName && (
                <div className="no-exam-name-alert">
                  <Alert
                    icon={<InfoCircleOutlined />}
                    showIcon
                    type="info"
                    message="未选择考试名称映射列"
                    description={
                      <div className="default-exam-name-input-wrapper">
                        <span>系统将默认填充考试名称为：</span>
                        <Input
                          value={localDefaultExamName}
                          onChange={(e) => setLocalDefaultExamName(e.target.value)}
                          maxLength={50}
                          placeholder="例如：期末考试"
                          style={{ width: '200px', display: 'inline-block', margin: '0 8px' }}
                        />
                        <span>（后续步骤中可单独修改）</span>
                      </div>
                    }
                  />
                </div>
              )}
            </div>

            {hasConflict && (
              <Alert
                message="映射配置有冲突"
                description="请注意：不同的系统字段不能指向同一个 Excel 列。请修改以消除冲突。"
                type="error"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}

            {/* 数据预览书签 */}
            <div className="preview-bookmark-wrapper">
              <div className="preview-bookmark-tab">📊 映射数据预览 (前3行)</div>
              <div className="preview-table-container">
                <Table
                  dataSource={getPreviewData()}
                  columns={previewColumns}
                  pagination={false}
                  size="small"
                  className="custom-preview-table"
                />
              </div>
            </div>

            <div className="form-actions-wrapper">
              <Space size="middle">
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setStep('upload')}
                  className="custom-btn"
                >
                  返回上传
                </Button>
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  disabled={!isValid || hasConflict}
                  onClick={handleNext}
                  className="custom-btn btn-primary"
                >
                  确认映射关系
                </Button>
              </Space>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};
