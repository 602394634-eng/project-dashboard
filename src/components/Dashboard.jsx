import React, { useState } from 'react';
import { OverviewTab } from './OverviewTab.jsx';
import { ProjectListTab } from './ProjectListTab.jsx';
import { AlertTab } from './AlertTab.jsx';
import { ExceptionTab } from './ExceptionTab.jsx';
import { MeetingTab } from './MeetingTab.jsx';
import { ProjectDetail } from './ProjectDetail.jsx';
import { LoadingSpinner, ErrorMessage } from './UI.jsx';
import { useDashboardData } from '../hooks/useDashboardData.js';
import { extractProjects, extractProductionData, extractExceptions, extractTrialData } from '../data/processor.js';

const TABS = [
  { id: 'overview', label: '概览', icon: '📊' },
  { id: 'projects', label: '项目列表', icon: '📋' },
  { id: 'alerts', label: '预警/超期', icon: '⚠️' },
  { id: 'exceptions', label: '异常管理', icon: '🚨' },
  { id: 'meeting', label: '例会视图', icon: '📅' },
];

function formatTime(timestamp) {
  if (!timestamp) return '--';
  const d = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;
  return d.toLocaleString('zh-CN');
}

export function Dashboard() {
  const { data: sheets, loading, error, refresh, syncInfo, isSyncing } = useDashboardData();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProject, setSelectedProject] = useState(null);

  // 处理原始数据
  const processedData = React.useMemo(() => {
    if (!sheets) return null;
    return {
      sheet2: sheets[2],
      sheet13: sheets[13],
      sheet1: sheets[1],
      sheet11: sheets[11],
      sheet5: sheets[5],
      sheet15: sheets[15],
      projects: extractProjects(sheets[15]),
      productionData: extractProductionData(sheets[2]),
      exceptions: extractExceptions(sheets[11]),
      trialData: extractTrialData(sheets[13]),
    };
  }, [sheets]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refresh} />;

  const renderContent = () => {
    if (selectedProject) {
      return <ProjectDetail projectItems={selectedProject} onBack={() => setSelectedProject(null)} />;
    }

    switch (activeTab) {
      case 'overview':
        return <OverviewTab data={processedData} />;
      case 'projects':
        return <ProjectListTab data={processedData} onProjectClick={setSelectedProject} />;
      case 'alerts':
        return <AlertTab data={processedData} />;
      case 'exceptions':
        return <ExceptionTab data={processedData} />;
      case 'meeting':
        return <MeetingTab data={processedData} />;
      default:
        return <OverviewTab data={processedData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📊</div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">项目管理看板</h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">营运部 · WPS实时同步</p>
                  {syncInfo && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      在线
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {syncInfo && (
                <span className="text-xs text-gray-400 hidden md:inline">
                  上次同步: {formatTime(syncInfo.last_sync)}
                </span>
              )}
              <button 
                onClick={refresh}
                disabled={isSyncing}
                className={`p-2 rounded-lg transition-colors ${
                  isSyncing 
                    ? 'text-blue-400 animate-spin' 
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title="同步WPS数据"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab 导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedProject(null);
                }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderContent()}
      </main>

      {/* 底部 */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-400">
          项目管理看板 · 数据来源：WPS云表格 · 
          {syncInfo ? (
            <span>最后同步：{formatTime(syncInfo.last_sync)} · 自动刷新：5分钟</span>
          ) : (
            <span>离线模式（本地数据）</span>
          )}
        </div>
      </footer>
    </div>
  );
}
