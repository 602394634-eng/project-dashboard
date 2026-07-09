import React, { useState, useMemo } from 'react';
import { DataTable, FilterBar, SearchInput, StatusBadge, LoadingSpinner } from './UI.jsx';

export function ProjectListTab({ data, onProjectClick }) {
  if (!data) return <LoadingSpinner />;

  const { projects } = data;
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ productLine: '', pm: '', stage: '' });

  // 获取筛选选项
  const productLines = [...new Set(projects.map(p => p.productType).filter(Boolean))];
  const pms = [...new Set(projects.map(p => p.pm || p.projectManager).filter(Boolean))];
  const stages = [...new Set(projects.map(p => p.stage).filter(Boolean))];

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
      key: 'stage',
      label: '项目阶段',
      options: stages.map(s => ({ value: s, label: s })),
    },
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 过滤和搜索
  const filteredProjects = useMemo(() => {
    let result = [...projects];
    
    if (filters.productLine) {
      result = result.filter(p => p.productType === filters.productLine);
    }
    if (filters.pm) {
      result = result.filter(p => (p.pm || p.projectManager) === filters.pm);
    }
    if (filters.stage) {
      result = result.filter(p => p.stage === filters.stage);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.workOrder && p.workOrder.toLowerCase().includes(q))
      );
    }
    
    return result;
  }, [projects, filters, searchQuery]);

  // 按项目名分组
  const groupedProjects = useMemo(() => {
    const groups = {};
    filteredProjects.forEach(p => {
      const key = p.name;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(p);
    });
    return groups;
  }, [filteredProjects]);

  const columns = [
    { key: 'seq', title: '序号', render: (v, row) => row[0]?.seq || '' },
    { key: 'name', title: '项目名称' },
    { key: 'workOrder', title: '工作令号' },
    { key: 'productType', title: '产品类型' },
    { key: 'stage', title: '当前阶段', render: (v) => <StatusBadge status={v} /> },
    { key: 'pm', title: '项目经理', render: (v, row) => row[0]?.pm || row[0]?.projectManager || '' },
    { key: 'quantity', title: '数量' },
    { key: 'deliveryDate', title: '交付日期' },
  ];

  // 将分组转换为表格数据
  const tableData = Object.entries(groupedProjects).map(([name, items]) => ({
    id: name,
    name,
    workOrder: items[0].workOrder,
    productType: items.map(i => i.productType).filter(Boolean).join(', '),
    stage: items[0].stage,
    pm: items[0].pm || items[0].projectManager,
    quantity: items.map(i => i.quantity).filter(Boolean).join(', '),
    deliveryDate: items[0].deliveryDate,
    _items: items,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchInput 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder="搜索项目名称或工作令号..."
          />
        </div>
      </div>
      
      <FilterBar 
        filters={filterConfig} 
        values={filters} 
        onChange={handleFilterChange}
      />
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-3 border-b border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            共 <strong className="text-gray-800">{Object.keys(groupedProjects).length}</strong> 个项目，
            <strong className="text-gray-800">{filteredProjects.length}</strong> 个子项
          </span>
        </div>
        <DataTable
          columns={columns}
          data={tableData}
          onRowClick={(row) => onProjectClick && onProjectClick(row._items)}
          rowKey="id"
        />
      </div>
    </div>
  );
}
