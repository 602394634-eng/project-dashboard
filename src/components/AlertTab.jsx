import React, { useState, useMemo } from 'react';
import { DataTable, FilterBar, StatusBadge, LoadingSpinner } from './UI.jsx';
import { computeAlerts } from '../data/processor.js';

export function AlertTab({ data }) {
  if (!data) return <LoadingSpinner />;

  const { projects, exceptions } = data;
  const [activeTab, setActiveTab] = useState('alert'); // 'alert' | 'overdue'
  const [filters, setFilters] = useState({ productLine: '', pm: '' });

  const { alerts, overdue } = useMemo(() => computeAlerts(projects, exceptions), [projects, exceptions]);

  const productLines = [...new Set(exceptions.map(e => e.productType).filter(Boolean))];
  const pms = [...new Set(exceptions.map(e => e.pm).filter(Boolean))];

  const filterConfig = [
    {
      key: 'productLine',
      label: '产品线',
      options: productLines.map(pl => ({ value: pl, label: pl })),
    },
    {
      key: 'pm',
      label: '项目经理',
      options: pms.map(pm => ({ value: pm, label: pm })),
    },
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const currentData = activeTab === 'alert' ? alerts : overdue;

  const filteredData = useMemo(() => {
    let result = [...currentData];
    if (filters.productLine) {
      result = result.filter(item => item.productType === filters.productLine);
    }
    if (filters.pm) {
      result = result.filter(item => item.pm === filters.pm);
    }
    return result;
  }, [currentData, filters]);

  const columns = [
    { key: 'projectName', title: '项目名称' },
    { key: 'productType', title: '产品类型' },
    { key: 'pm', title: '项目经理' },
    { key: 'stage', title: '异常阶段' },
    { key: 'plannedClose', title: '计划闭环时间' },
    { 
      key: 'daysDiff', 
      title: '剩余天数',
      render: (v) => (
        <span className={`font-bold ${v < 0 ? 'text-red-600' : v <= 1 ? 'text-yellow-600' : 'text-green-600'}`}>
          {v < 0 ? `超期 ${Math.abs(v)} 天` : v === 0 ? '今天到期' : `剩余 ${v} 天`}
        </span>
      )
    },
    { key: 'description', title: '异常描述', render: (v) => (
      <div className="max-w-xs truncate" title={v}>{v}</div>
    )},
  ];

  return (
    <div className="space-y-4">
      {/* 切换标签 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('alert')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'alert' 
              ? 'bg-yellow-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          预警 ({alerts.length})
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'overdue' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          超期 ({overdue.length})
        </button>
      </div>

      <FilterBar 
        filters={filterConfig} 
        values={filters} 
        onChange={handleFilterChange}
      />

      <div className="bg-white rounded-lg shadow">
        <div className="p-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">
            共 <strong className="text-gray-800">{filteredData.length}</strong> 条记录
          </span>
        </div>
        <DataTable
          columns={columns}
          data={filteredData}
          rowKey={(row, i) => `${row.projectName}-${i}`}
        />
      </div>
    </div>
  );
}
