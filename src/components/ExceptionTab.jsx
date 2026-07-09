import React, { useState, useMemo } from 'react';
import { DataTable, FilterBar, StatusBadge, LoadingSpinner } from './UI.jsx';

export function ExceptionTab({ data }) {
  if (!data) return <LoadingSpinner />;

  const { exceptions } = data;
  const [filters, setFilters] = useState({ productLine: '', pm: '', level: '', status: '' });

  const productLines = [...new Set(exceptions.map(e => e.productType).filter(Boolean))];
  const pms = [...new Set(exceptions.map(e => e.pm).filter(Boolean))];
  const levels = [...new Set(exceptions.map(e => e.level).filter(Boolean))];

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
    {
      key: 'level',
      label: '异常等级',
      options: levels.map(l => ({ value: l, label: l })),
    },
    {
      key: 'status',
      label: '闭环状态',
      options: [
        { value: 'open', label: '未闭环' },
        { value: 'closed', label: '已闭环' },
      ],
    },
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredExceptions = useMemo(() => {
    let result = [...exceptions];
    if (filters.productLine) {
      result = result.filter(e => e.productType === filters.productLine);
    }
    if (filters.pm) {
      result = result.filter(e => e.pm === filters.pm);
    }
    if (filters.level) {
      result = result.filter(e => e.level === filters.level);
    }
    if (filters.status) {
      if (filters.status === 'open') {
        result = result.filter(e => {
          const desc = (e.description || '').toLowerCase();
          return !desc.includes('已闭环') && !desc.includes('闭环');
        });
      } else {
        result = result.filter(e => {
          const desc = (e.description || '').toLowerCase();
          return desc.includes('已闭环') || desc.includes('闭环');
        });
      }
    }
    return result;
  }, [exceptions, filters]);

  const columns = [
    { key: 'projectName', title: '项目名称' },
    { key: 'productType', title: '产品类型' },
    { key: 'pm', title: '项目经理' },
    { key: 'contractQty', title: '合同数量' },
    { key: 'deliveryDate', title: '交付日期' },
    { key: 'exceptionStage', title: '异常阶段' },
    { key: 'level', title: '等级', render: (v) => {
      const color = v?.includes('重大') ? 'bg-red-100 text-red-700' : 
                    v?.includes('中等') ? 'bg-orange-100 text-orange-700' : 
                    'bg-yellow-100 text-yellow-700';
      return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{v}</span>;
    }},
    { key: 'description', title: '异常描述', render: (v) => (
      <div className="max-w-xs truncate" title={v}>{v}</div>
    )},
    { key: 'solution', title: '解决措施', render: (v) => (
      <div className="max-w-xs truncate" title={v}>{v}</div>
    )},
  ];

  return (
    <div className="space-y-4">
      <FilterBar 
        filters={filterConfig} 
        values={filters} 
        onChange={handleFilterChange}
      />

      <div className="bg-white rounded-lg shadow">
        <div className="p-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">
            共 <strong className="text-gray-800">{filteredExceptions.length}</strong> 条异常记录
          </span>
        </div>
        <DataTable
          columns={columns}
          data={filteredExceptions}
          rowKey={(row, i) => `${row.projectName}-${row._rowIndex}-${i}`}
        />
      </div>
    </div>
  );
}
