import { Layout, Steps, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useExamStore } from './stores/examStore';
import { FileUploader } from './components/FileUploader';
import { ColumnMapper } from './components/ColumnMapper';
import { ExamInfo } from './components/ExamInfo';
import { ReminderConfig } from './components/ReminderConfig';
import { DownloadButton } from './components/DownloadButton';
import './App.css';

const { Header, Content, Footer } = Layout;

export default function App() {
  const { step } = useExamStore();

  // 映射当前步骤为 Steps 组件的索引
  const getStepIndex = () => {
    switch (step) {
      case 'upload':
        return 0;
      case 'mapping':
        return 1;
      case 'confirm':
        return 2;
      case 'download':
        return 3;
      default:
        return 0;
    }
  };

  // 根据当前步骤渲染对应组件
  const renderStepComponent = () => {
    switch (step) {
      case 'upload':
        return <FileUploader />;
      case 'mapping':
        return <ColumnMapper />;
      case 'confirm':
        return (
          <div className="confirm-step-container">
            <ReminderConfig />
            <ExamInfo />
          </div>
        );
      case 'download':
        return <DownloadButton />;
      default:
        return <FileUploader />;
    }
  };

  // Ant Design 自定义主题配置 - 融入学术纸张笔记本设计
  const customTheme = {
    algorithm: theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1D3E53', // 学术蓝
      colorSuccess: '#2e7d32',
      colorWarning: '#f9a825',
      colorError: '#d32f2f',
      colorInfo: '#1D3E53',
      colorTextBase: '#1F2421', // 墨黑色油墨质感
      colorBgBase: '#FAF9F6', // 护眼纸张色
      borderRadius: 6,
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    },
    components: {
      Steps: {
        colorPrimary: '#1D3E53',
        navArrowColor: '#1D3E53',
      },
      Button: {
        colorPrimary: '#1D3E53',
        colorPrimaryHover: '#2a5672',
      },
      Slider: {
        colorPrimary: '#1D3E53',
        colorPrimaryBorder: '#1D3E53',
      },
      Checkbox: {
        colorPrimary: '#1D3E53',
      },
      Select: {
        colorPrimary: '#1D3E53',
      },
    },
  };

  return (
    <ConfigProvider theme={customTheme} locale={zhCN}>
      <Layout className="app-layout">
        <Header className="app-header">
          <div className="header-title-area">
            <h1 className="main-logo-title">🎓 期末考试日历导入工具</h1>
            <p className="sub-logo-title">Exam to ICS Calendar Converter</p>
          </div>
          
          <div className="steps-container">
            <Steps
              current={getStepIndex()}
              items={[
                { title: '上传文件', description: '选择 Excel 安排表' },
                { title: '字段映射', description: '智能绑定数据列' },
                { title: '信息确认', description: '核对及微调内容' },
                { title: '生成下载', description: '导出 ICS 日历文件' },
              ]}
              className="custom-steps"
            />
          </div>
        </Header>
        
        <Content className="app-content">
          <div className="workspace-card">
            {renderStepComponent()}
          </div>
        </Content>

        <Footer className="app-footer">
          <p>© 2026 QtZero 期末考试日历导入工具.</p>
          <p className="privacy-badge">🔒 隐私说明：解析完全基于客户端本地进行，系统不会以任何形式收集、记录或上传您的 Excel 数据。</p>
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}
