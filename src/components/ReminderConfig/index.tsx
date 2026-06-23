import React from 'react';
import { Slider, InputNumber, Button, Space, Tooltip } from 'antd';
import { BellOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useExamStore } from '../../stores/examStore';
import { REMINDER_CONFIG } from '../../constants/fieldMappings';

export const ReminderConfig: React.FC = () => {
  const { globalReminderMinutes, setGlobalReminderMinutes } = useExamStore();

  const handleSliderChange = (value: number | null) => {
    if (value !== null) {
      setGlobalReminderMinutes(value);
    }
  };

  const formatDisplayTime = (minutes: number): string => {
    if (minutes === 0) return '考试开始时';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `提前 ${hours} 小时${mins > 0 ? ` ${mins} 分钟` : ''}`;
    }
    return `提前 ${mins} 分钟`;
  };

  return (
    <div className="reminder-config-card">
      <div className="reminder-header">
        <Space>
          <BellOutlined className="bell-icon" />
          <span className="reminder-title">🔔 全局日程提醒配置</span>
          <Tooltip title="此处设置的时间将应用于所有没有单独设置自定义提醒的考试。导出的 ICS 日历文件会在手机或电脑日历上以此时间弹出通知。">
            <QuestionCircleOutlined className="help-icon" />
          </Tooltip>
        </Space>
      </div>

      <div className="reminder-body">
        <div className="reminder-controls">
          <Slider
            min={REMINDER_CONFIG.min}
            max={REMINDER_CONFIG.max}
            value={globalReminderMinutes}
            onChange={handleSliderChange}
            className="custom-slider"
            style={{ flexGrow: 1 }}
          />
          <InputNumber
            min={REMINDER_CONFIG.min}
            max={REMINDER_CONFIG.max}
            value={globalReminderMinutes}
            onChange={(val) => val !== null && setGlobalReminderMinutes(val)}
            className="custom-input-number"
            addonAfter="分钟"
          />
        </div>

        <div className="reminder-presets">
          <span className="preset-label">快捷选项:</span>
          <Space>
            {REMINDER_CONFIG.presets.map((preset) => (
              <Button
                key={preset}
                type={globalReminderMinutes === preset ? 'primary' : 'default'}
                onClick={() => setGlobalReminderMinutes(preset)}
                size="small"
                className="preset-btn"
              >
                {preset === 60 ? '1 小时' : preset === 120 ? '2 小时' : `${preset} 分钟`}
              </Button>
            ))}
          </Space>
        </div>

        <div className="reminder-preview-text">
          日历提醒时间：<span className="highlight-text">{formatDisplayTime(globalReminderMinutes)}</span>
        </div>
      </div>
    </div>
  );
};
