import React, { useState } from 'react';
import { Card, Button, Checkbox, Input, Select, Modal, Form, Slider, InputNumber, Tag, Tooltip, Space, Row, Col, Empty, Divider } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  BellOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useExamStore } from '../../stores/examStore';
import { validateExamItem } from '../../utils/validator';
import { formatExamTimeDisplay, parseExamTime } from '../../utils/timeParser';
import type { ExamItem } from '../../types/exam';
import { REMINDER_CONFIG } from '../../constants/fieldMappings';

export const ExamInfo: React.FC = () => {
  const {
    exams,
    examNameTypes,
    globalReminderMinutes,
    updateExam,
    deleteExam,
    batchUpdateExamName,
    selectedCategories,
    setSelectedCategories,
    setStep,
  } = useExamStore();

  // 局部状态
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [checkedCategories, setCheckedCategories] = useState<string[]>(() =>
    selectedCategories.length > 0 ? selectedCategories : examNameTypes
  );
  const [globalRenameTarget, setGlobalRenameTarget] = useState('期末考试');
  const [globalRenameNewValue, setGlobalRenameNewValue] = useState('');

  // 编辑 Modal 状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [editForm] = Form.useForm();
  const [useCustomReminder, setUseCustomReminder] = useState(false);



  // 处理全局分类重命名
  const handleGlobalRename = () => {
    if (!globalRenameTarget) return;
    const newName = globalRenameNewValue.trim();
    if (!newName) {
      Modal.error({ title: '重命名失败', content: '考试名称不能为空！' });
      return;
    }
    if (newName.length > 50) {
      Modal.error({ title: '重命名失败', content: '考试名称不能超过 50 个字符！' });
      return;
    }

    Modal.confirm({
      title: '确认批量重命名吗？',
      content: `这将会把所有名为 "${globalRenameTarget}" 的考试重命名为 "${newName}"。`,
      onOk: () => {
        batchUpdateExamName(globalRenameTarget, newName);
        // 如果被重命名的分类处于被选中状态，更新选中的分类列表
        setCheckedCategories((prev) =>
          prev.map((c) => (c === globalRenameTarget ? newName : c))
        );
        // 更新 activeTab
        if (activeTab === globalRenameTarget) {
          setActiveTab(newName);
        }
        setGlobalRenameNewValue('');
        Modal.success({ title: '重命名成功', content: '已完成批量重命名！' });
      },
    });
  };

  // 处理 Tab 勾选状态切换
  const handleCategoryCheckboxChange = (category: string, checked: boolean) => {
    if (checked) {
      setCheckedCategories((prev) => [...prev, category]);
    } else {
      setCheckedCategories((prev) => prev.filter((c) => c !== category));
    }
  };

  // 处理全选/全不选分类
  const handleToggleSelectAllCategories = (checked: boolean) => {
    if (checked) {
      setCheckedCategories(examNameTypes);
    } else {
      setCheckedCategories([]);
    }
  };

  // 打开编辑 Modal
  const openEditModal = (exam: ExamItem) => {
    setEditingExam(exam);
    setUseCustomReminder(exam.reminderMinutes !== undefined);
    editForm.setFieldsValue({
      courseName: exam.courseName,
      examName: exam.examName,
      examTime: exam.examTime,
      location: exam.location,
      seatNumber: exam.seatNumber,
      reminderMinutes: exam.reminderMinutes ?? globalReminderMinutes,
    });
    setIsEditModalOpen(true);
  };

  // 保存编辑后的考试信息
  const handleSaveEdit = () => {
    if (!editingExam) return;

    editForm
      .validateFields()
      .then((values) => {
        const updates: Partial<ExamItem> = {
          courseName: values.courseName.trim(),
          examName: values.examName.trim(),
          examTime: values.examTime.trim(),
          location: values.location.trim(),
          seatNumber: values.seatNumber.trim(),
          reminderMinutes: useCustomReminder ? values.reminderMinutes : undefined,
        };

        updateExam(editingExam.id, updates);
        setIsEditModalOpen(false);
        setEditingExam(null);
        Modal.success({ title: '保存成功', content: '考试信息已成功更新。' });
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  // 处理考试卡片上的分类快速切换
  const handleQuickCategoryChange = (examId: string, value: string) => {
    if (value === '__NEW__') {
      let tempNewName = '';
      Modal.confirm({
        title: '新建考试分类',
        content: (
          <div style={{ marginTop: 12 }}>
            <p>请输入新的分类名称：</p>
            <Input
              maxLength={50}
              placeholder="例如：阶段测试、口试"
              onChange={(e) => {
                tempNewName = e.target.value;
              }}
            />
          </div>
        ),
        onOk: () => {
          const finalName = tempNewName.trim();
          if (!finalName) {
            Modal.error({ content: '分类名称不能为空！' });
            return Promise.reject();
          }
          updateExam(examId, { examName: finalName });
          // 新添加的分组默认加入导出列表
          setCheckedCategories((prev) => {
            if (!prev.includes(finalName)) {
              return [...prev, finalName];
            }
            return prev;
          });
        },
      });
    } else {
      updateExam(examId, { examName: value });
    }
  };

  // 过滤当前展示的考试
  const displayedExams = exams.filter((exam) => {
    if (activeTab === 'ALL') return true;
    return exam.examName === activeTab;
  });

  // 获取即将导出的考试总数 (属于被勾选分类的所有考试)
  const exportExamsCount = exams.filter((exam) =>
    checkedCategories.includes(exam.examName)
  ).length;

  // 下一步 (进入下载页面)
  const handleProceed = () => {
    if (exportExamsCount === 0) {
      Modal.warning({
        title: '无法继续',
        content: '请至少选择一个包含考试记录的分类进行导出！',
      });
      return;
    }
    
    // 保存选择的分类到 store
    setSelectedCategories(checkedCategories);
    setStep('download');
  };

  return (
    <div className="exam-info-workspace">
      {/* 顶部全局配置栏 */}
      <div className="workspace-header-actions">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={14}>
            <div className="global-rename-box">
              <span className="action-title">🏷️ 批量重命名：</span>
              <Space>
                <Select
                  value={globalRenameTarget}
                  onChange={setGlobalRenameTarget}
                  style={{ width: 140 }}
                  className="custom-select"
                >
                  {examNameTypes.map((t) => (
                    <Select.Option key={t} value={t}>
                      {t}
                    </Select.Option>
                  ))}
                </Select>
                <span>修改为</span>
                <Input
                  placeholder="新分类名称"
                  value={globalRenameNewValue}
                  onChange={(e) => setGlobalRenameNewValue(e.target.value)}
                  maxLength={50}
                  style={{ width: 160 }}
                />
                <Button type="primary" onClick={handleGlobalRename} className="custom-btn">
                  应用
                </Button>
              </Space>
            </div>
          </Col>
          <Col xs={24} md={10} style={{ textAlign: 'right' }}>
            <span className="total-badge-text">
              📊 共解析出 <strong>{exams.length}</strong> 场考试 (分 <strong>{examNameTypes.length}</strong> 个类别)
            </span>
          </Col>
        </Row>
      </div>

      {/* 主体部分：左/上侧分类侧边栏，右/下侧便签卡片桌 */}
      <div className="workspace-main-layout">
        {/* 左侧：精美手账彩签分类 */}
        <div className="category-bookmarks-container">
          <div className="bookmarks-header">
            <span>📚 导出分类选择</span>
            <Tooltip title="勾选的类别将会包含在最终导出的 ICS 日历文件中">
              <Checkbox
                indeterminate={
                  checkedCategories.length > 0 && checkedCategories.length < examNameTypes.length
                }
                checked={checkedCategories.length === examNameTypes.length}
                onChange={(e) => handleToggleSelectAllCategories(e.target.checked)}
                style={{ marginLeft: 8 }}
              >
                全选
              </Checkbox>
            </Tooltip>
          </div>

          <div className="bookmarks-list">
            {/* ALL 标签项 */}
            <div
              className={`bookmark-item all-bookmark ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              <div className="bookmark-label">
                <span className="bookmark-name">🔍 全部考试</span>
                <span className="bookmark-count">{exams.length}</span>
              </div>
            </div>

            {/* 个性分类彩签 */}
            {examNameTypes.map((type, index) => {
              const count = exams.filter((e) => e.examName === type).length;
              const isChecked = checkedCategories.includes(type);
              const colorHue = (index * 55) % 360; // 自动分配多彩彩签颜色

              return (
                <div
                  key={type}
                  className={`bookmark-item ${activeTab === type ? 'active' : ''}`}
                  style={{
                    borderLeft: activeTab === type ? `5px solid hsl(${colorHue}, 60%, 50%)` : `3px solid hsl(${colorHue}, 50%, 80%)`,
                  }}
                  onClick={() => setActiveTab(type)}
                >
                  <Checkbox
                    checked={isChecked}
                    onChange={(e) => handleCategoryCheckboxChange(type, e.target.checked)}
                    onClick={(e) => e.stopPropagation()} // 阻止触发 Tab 切换
                    className="bookmark-checkbox"
                  />
                  <div className="bookmark-label">
                    <span className="bookmark-name" title={type}>
                      {type}
                    </span>
                    <span className="bookmark-count" style={{ backgroundColor: `hsl(${colorHue}, 20%, 93%)` }}>
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：便签本样式桌 (Sticky Notes Workspace) */}
        <div className="notes-workspace-container">
          <div className="notes-workspace-info">
            <span className="current-view-title">
              📌 {activeTab === 'ALL' ? '所有考试列表' : `分类：${activeTab}`} ({displayedExams.length} 场)
            </span>
          </div>

          {displayedExams.length === 0 ? (
            <div className="empty-workspace-state">
              <Empty description="该分类下无考试记录" />
            </div>
          ) : (
            <div className="notes-grid">
              {displayedExams.map((exam, idx) => {
                const itemErrors = validateExamItem(exam, idx + 1);
                const hasErrors = itemErrors.some((e) => e.level === 'error');
                const hasWarnings = itemErrors.some((e) => e.level === 'warning');
                
                let cardClass = 'notebook-note-card';
                if (hasErrors) cardClass += ' note-error-highlight';
                else if (hasWarnings) cardClass += ' note-warning-highlight';

                return (
                  <Card
                    key={exam.id}
                    className={cardClass}
                    actions={[
                      <Tooltip title="编辑详情">
                        <EditOutlined key="edit" onClick={() => openEditModal(exam)} />
                      </Tooltip>,
                      <Tooltip title="删除考试记录">
                        <DeleteOutlined
                          key="delete"
                          onClick={() => {
                            Modal.confirm({
                              title: '确认删除吗？',
                              content: `确认将删除 "${exam.courseName}" 考试记录，此操作不可撤销。`,
                              onOk: () => deleteExam(exam.id),
                            });
                          }}
                        />
                      </Tooltip>,
                    ]}
                  >
                    {/* 便签撕角或荧光笔划重点效果 */}
                    <div className="note-card-pin" />

                    <div className="note-card-body">
                      {/* 警告高亮框 */}
                      {itemErrors.length > 0 && (
                        <div className="note-errors-container">
                          {itemErrors.map((err, i) => (
                            <div key={i} className={`error-item level-${err.level}`}>
                              <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                              {err.message}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 课程名称 (大字粗体) */}
                      <h4 className="note-course-title" title={exam.courseName}>
                        {exam.courseName}
                      </h4>

                      {/* 考试类型标签 (下拉归类) */}
                      <div className="note-category-row">
                        <span className="label-prefix">分类:</span>
                        <Select
                          size="small"
                          value={exam.examName}
                          onChange={(val) => handleQuickCategoryChange(exam.id, val)}
                          className="quick-category-select"
                          popupClassName="category-dropdown-popup"
                          dropdownRender={(menu) => (
                            <div>
                              {menu}
                              <Divider style={{ margin: '4px 0' }} />
                              <div
                                style={{ padding: '4px 8px', cursor: 'pointer', color: '#1D3E53' }}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleQuickCategoryChange(exam.id, '__NEW__')}
                              >
                                <PlusOutlined /> 新增自定义分类...
                              </div>
                            </div>
                          )}
                        >
                          {examNameTypes.map((t) => (
                            <Select.Option key={t} value={t}>
                              {t}
                            </Select.Option>
                          ))}
                        </Select>
                      </div>

                      <Divider style={{ margin: '10px 0' }} />

                      {/* 时间，地点，座号 */}
                      <div className="note-detail-item">
                        <CalendarOutlined className="detail-icon" />
                        <span className="detail-text">
                          {(() => {
                            try {
                              return formatExamTimeDisplay(
                                parseExamTime(exam.examTime)
                              );
                            } catch {
                              return <span className="error-text">{exam.examTime}</span>;
                            }
                          })()}
                        </span>
                      </div>

                      <div className="note-detail-item">
                        <EnvironmentOutlined className="detail-icon" />
                        <span className="detail-text" title={exam.location}>
                          {exam.location || <span className="empty-text">未填写地点</span>}
                        </span>
                      </div>

                      <div className="note-detail-item">
                        <UserOutlined className="detail-icon" />
                        <span className="detail-text">
                          座号: <Tag color="blue">{exam.seatNumber || '—'}</Tag>
                        </span>
                      </div>

                      {/* 提醒时间 */}
                      <div className="note-detail-item">
                        <BellOutlined className="detail-icon" />
                        <span className="detail-text">
                          提醒:{' '}
                          {exam.reminderMinutes !== undefined ? (
                            <Tag color="orange">提前 {exam.reminderMinutes} 分钟</Tag>
                          ) : (
                            <span className="global-hint-text">默认 (提前 {globalReminderMinutes} 分钟)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 底部导航操作条 */}
      <div className="workspace-footer-bar">
        <Space size="large">
          <Button onClick={() => setStep('mapping')} className="custom-btn btn-secondary">
            上一步
          </Button>
          <Button
            type="primary"
            onClick={handleProceed}
            className="custom-btn btn-primary"
            disabled={exportExamsCount === 0}
          >
            确认信息，生成 ICS (已选 {exportExamsCount} 场)
          </Button>
        </Space>
      </div>

      {/* 编辑 Modal */}
      <Modal
        title="📝 编辑考试细节"
        open={isEditModalOpen}
        onOk={handleSaveEdit}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingExam(null);
        }}
        okText="保存修改"
        cancelText="取消"
        destroyOnClose
        className="custom-editor-modal"
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: '16px' }}>
          <Form.Item
            name="courseName"
            label="课程名称"
            rules={[
              { required: true, message: '请输入课程名称' },
              { max: 50, message: '最长不能超过 50 个字符' },
            ]}
          >
            <Input maxLength={50} placeholder="例如：高等数学" />
          </Form.Item>

          <Form.Item
            name="examName"
            label="考试名称（分类）"
            rules={[
              { required: true, message: '请选择或输入考试类型' },
              { max: 50, message: '最长不能超过 50 个字符' },
            ]}
          >
            <Select
              showSearch
              placeholder="请选择或输入考试类型"
              className="custom-select"
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <Divider style={{ margin: '4px 0' }} />
                  <div
                    style={{ padding: '4px 8px', cursor: 'pointer', color: '#1D3E53' }}
                    onMouseDown={(_e) => _e.preventDefault()}
                    onClick={() => {
                      const newType = prompt('请输入新分类名称：');
                      if (newType && newType.trim()) {
                        const trimmed = newType.trim();
                        // 临时注入 Select 的 options
                        editForm.setFieldsValue({ examName: trimmed });
                      }
                    }}
                  >
                    <PlusOutlined /> 新建分类...
                  </div>
                </div>
              )}
            >
              {examNameTypes.map((t) => (
                <Select.Option key={t} value={t}>
                  {t}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="examTime"
            label="考试时间"
            rules={[
              { required: true, message: '请输入考试时间' },
              {
                pattern: /^\d{4}-\d{2}-\d{2}\(\d{2}:\d{2}-\d{2}:\d{2}\)$/,
                message: '格式必须为 YYYY-MM-DD(HH:mm-HH:mm)，例如：2026-07-06(12:00-14:00)',
              },
            ]}
            help="格式：YYYY-MM-DD(HH:mm-HH:mm)，例如：2026-07-06(12:00-14:00)"
          >
            <Input placeholder="YYYY-MM-DD(HH:mm-HH:mm)" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="location"
                label="考试地点"
                rules={[
                  { required: true, message: '请输入考试地点' },
                  { max: 100, message: '最长不能超过 100 个字符' },
                ]}
              >
                <Input maxLength={100} placeholder="例如：13-101 教室" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="seatNumber"
                label="考试座号"
                rules={[
                  { required: true, message: '请输入座号' },
                  { max: 20, message: '最长不能超过 20 个字符' },
                ]}
              >
                <Input maxLength={20} placeholder="例如：17" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginBottom: 8, fontWeight: 500 }}>🔔 提醒选项：</div>
          <Checkbox
            checked={useCustomReminder}
            onChange={(e) => setUseCustomReminder(e.target.checked)}
            style={{ marginBottom: 16 }}
          >
            为此科目配置独立的自定义提前提醒时间（覆盖全局默认值）
          </Checkbox>

          {useCustomReminder && (
            <Form.Item name="reminderMinutes" label="自定义提前提醒时间（分钟）">
              <Row gutter={16} align="middle">
                <Col span={16}>
                  <Slider
                    min={REMINDER_CONFIG.min}
                    max={REMINDER_CONFIG.max}
                    onChange={(val) => editForm.setFieldsValue({ reminderMinutes: val })}
                  />
                </Col>
                <Col span={8}>
                  <InputNumber
                    min={REMINDER_CONFIG.min}
                    max={REMINDER_CONFIG.max}
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};
