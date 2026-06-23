import React, { useState } from 'react';
import { Button, Tabs, Space, Divider, message, Spin } from 'antd';
import {
  DownloadOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  AppleOutlined,
  AndroidOutlined,
  WindowsOutlined,
  ChromeOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useExamStore } from '../../stores/examStore';
import { generateAndDownloadICS } from '../../utils/icsGenerator';

export const DownloadButton: React.FC = () => {
  const {
    exams,
    selectedCategories,
    globalReminderMinutes,
    setStep,
    reset,
  } = useExamStore();

  const [downloading, setDownloading] = useState(false);

  // 过滤出用户勾选了分类的考试
  const examsToExport = exams.filter((exam) =>
    selectedCategories.includes(exam.examName)
  );

  // 处理下载
  const handleDownload = () => {
    if (examsToExport.length === 0) {
      message.error('没有选中的考试可供导出！');
      return;
    }

    setDownloading(true);

    // 延迟 800ms 模拟水墨浸润的加载动效，提供更具质感的交互体验
    setTimeout(() => {
      try {
        generateAndDownloadICS(
          examsToExport,
          globalReminderMinutes,
          `期末考试日程-${Date.now()}.ics`
        );
        message.success('🎉 日历文件生成成功，已开始下载！');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '生成日历文件失败。';
        message.error(errorMessage);
      } finally {
        setDownloading(false);
      }
    }, 800);
  };

  // 获取导出统计文本
  const getStatisticsText = () => {
    const stats: Record<string, number> = {};
    examsToExport.forEach((e) => {
      stats[e.examName] = (stats[e.examName] || 0) + 1;
    });

    return Object.entries(stats)
      .map(([name, count]) => `${count} 场 "${name}"`)
      .join('、');
  };

  // 各平台导入教程内容
  const importManuals = [
    {
      key: 'ios',
      label: (
        <span>
          <AppleOutlined /> iOS / macOS (苹果日历)
        </span>
      ),
      children: (
        <div className="manual-content">
          <h4>📱 苹果设备导入指南：</h4>
          <ol>
            <li><strong>iPhone/iPad 直接导入</strong>：下载完成后，在“文件”应用中找到该 `.ics` 文件，点击打开。系统会自动弹出日历导入界面，选择“全部添加”并挑选您存放考试的日历（推荐新建一个名为“考试”的日历，方便归档和清空）。</li>
            <li><strong>AirDrop (隔空投送)</strong>：若是在 Mac 上下载的，可以直接将文件 AirDrop 发送到 iPhone，手机上会自动唤起日历应用进行导入。</li>
            <li><strong>iCloud 同步</strong>：直接双击 Mac 上的 `.ics` 文件，它将导入到您的 Mac 日历中，并自动通过 iCloud 同步到您的 iPhone 或 iPad。</li>
          </ol>
        </div>
      ),
    },
    {
      key: 'android',
      label: (
        <span>
          <AndroidOutlined /> Android (安卓日历)
        </span>
      ),
      children: (
        <div className="manual-content">
          <h4>🤖 安卓设备导入指南：</h4>
          <ol>
            <li><strong>系统日历导入</strong>：大多数安卓手机（如小米、华为、OPPO、VIVO）在下载完成 `.ics` 文件后，直接在“文件管理器”中点击该文件，系统会自动询问使用“日历”打开，点击导入即可。</li>
            <li><strong>如果直接打开失败</strong>：</li>
            <ul>
              <li>打开您手机自带的“日历”应用。</li>
              <li>进入“设置”或“日历账户管理”。</li>
              <li>寻找“导入/导出日历”或“从本地文件导入”选项，手动选择下载的 `.ics` 文件。</li>
            </ul>
          </ol>
        </div>
      ),
    },
    {
      key: 'google',
      label: (
        <span>
          <ChromeOutlined /> Google Calendar (谷歌日历)
        </span>
      ),
      children: (
        <div className="manual-content">
          <h4>🌐 网页版谷歌日历导入指南：</h4>
          <ol>
            <li>在电脑浏览器中访问 <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer">Google Calendar (谷歌日历)</a>。</li>
            <li>点击右上角的<strong>“齿轮图标 (设置)” &gt; “设置”</strong>。</li>
            <li>在左侧菜单栏选择<strong>“导入和导出”</strong>。</li>
            <li>在“选择本地文件”中上传刚才下载的 `.ics` 文件。</li>
            <li>在“添加到日历”中选择目标日历（如您的主日历），然后点击<strong>“导入”</strong>按钮。</li>
          </ol>
        </div>
      ),
    },
    {
      key: 'outlook',
      label: (
        <span>
          <WindowsOutlined /> Outlook / Win11 日历
        </span>
      ),
      children: (
        <div className="manual-content">
          <h4>💻 Windows / Outlook 导入指南：</h4>
          <ol>
            <li><strong>Outlook 客户端</strong>：在电脑中双击下载好的 `.ics` 文件，Outlook 客户端会自动启动并询问是否将这些日程保存到您的日历。</li>
            <li><strong>Windows 11 “日历”应用</strong>：双击文件，系统通常会使用内置日历软件打开，确认保存即可。</li>
            <li><strong>网页版 Outlook</strong>：登录 Outlook 网页端，点击日历视图，选择“添加日历” &gt; “从文件上传”，选中该 `.ics` 文件即可。</li>
          </ol>
        </div>
      ),
    },
  ];

  return (
    <div className="download-container">
      <div className="uploader-card">
        {/* 书页穿孔效果 */}
        <div className="notebook-spine">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="spine-hole" />
          ))}
        </div>

        <div className="uploader-content">
          <div className="submit-bag-title">
            <span className="serif-step">04</span>
            <span className="step-name">/ 生成与下载</span>
          </div>

          <div className="download-workspace-inner">
            {/* 校对合格章印章卡片 */}
            <div className="qualified-stamp-card">
              <div className="qualified-stamp">
                <div className="stamp-inner">
                  <CheckCircleOutlined className="stamp-icon" />
                  <div className="stamp-text">校对合格</div>
                  <div className="stamp-date">APPROVED</div>
                </div>
              </div>

              <div className="qualified-details">
                <h3>📋 考试日历生成报告</h3>
                <div className="report-list">
                  <p>
                    📅 共选出：<strong>{examsToExport.length}</strong> 场考试进行导出
                  </p>
                  <p>
                    🏷️ 导出分类：{getStatisticsText()}
                  </p>
                  <p>
                    🔔 默认提醒：考试开始前 <strong>{globalReminderMinutes}</strong> 分钟
                  </p>
                </div>
              </div>
            </div>

            {/* 大下载按钮 */}
            <div className="download-btn-wrapper">
              <Spin spinning={downloading}>
                <Button
                  type="primary"
                  size="large"
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                  disabled={downloading}
                  className={`custom-download-btn ${downloading ? 'ink-loading' : ''}`}
                >
                  {downloading ? '正在生成日程...' : '生成并下载 .ics 日历文件'}
                </Button>
              </Spin>
            </div>

            <Divider style={{ margin: '30px 0 20px' }} />

            {/* 设备导入说明册 */}
            <div className="manual-notebook-wrapper">
              <div className="notebook-tab-title">📖 设备导入配置手册</div>
              <Tabs
                defaultActiveKey="ios"
                items={importManuals}
                className="custom-manual-tabs"
              />
            </div>

            {/* 重置及返回导航 */}
            <div className="download-actions">
              <Space size="large">
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setStep('confirm')}
                  className="custom-btn btn-secondary"
                >
                  返回修改
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    reset();
                    message.info('系统已重置，您可以重新上传新文件。');
                  }}
                  className="custom-btn"
                >
                  重新导入新文件
                </Button>
              </Space>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
