import React, { useState, useEffect } from 'react';
import * as echarts from 'echarts';

export function StatCard({ title, value, subtitle, color = 'blue', icon }) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorMap[color] || colorMap.blue}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs mt-1 opacity-70">{subtitle}</p>}
        </div>
        {icon && <div className="text-2xl opacity-50">{icon}</div>}
      </div>
    </div>
  );
}

export function LineChart({ data, xAxis, series, title, height = 300 }) {
  const chartRef = React.useRef(null);
  const chartInstance = React.useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;
    
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const option = {
      title: {
        text: title,
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: xAxis,
        axisLabel: { rotate: 30 }
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '{value}%' }
      },
      series: series.map(s => ({
        ...s,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3 }
      }))
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current && chartInstance.current.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, xAxis, series, title]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}

export function BarChart({ data, xAxis, series, title, height = 300 }) {
  const chartRef = React.useRef(null);
  const chartInstance = React.useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;
    
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const option = {
      title: {
        text: title,
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: xAxis,
        axisLabel: { rotate: 30 }
      },
      yAxis: { type: 'value' },
      series: series.map(s => ({
        ...s,
        type: 'bar',
        barWidth: '40%'
      }))
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current && chartInstance.current.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, xAxis, series, title]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}

export function PieChart({ data, title, height = 300 }) {
  const chartRef = React.useRef(null);
  const chartInstance = React.useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;
    
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const option = {
      title: {
        text: title,
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: true, formatter: '{b}: {c} ({d}%)' },
        data
      }]
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current && chartInstance.current.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, title]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}

export function DataTable({ columns, data, onRowClick, rowKey = 'id' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200">
            {columns.map((col, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr 
              key={row[rowKey] || i} 
              className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col, j) => (
                <td key={j} className="px-3 py-2 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FilterBar({ filters, values, onChange }) {
  return (
    <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
      {filters.map((filter) => (
        <div key={filter.key} className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">{filter.label}</label>
          <select
            className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={values[filter.key] || ''}
            onChange={(e) => onChange(filter.key, e.target.value)}
          >
            <option value="">全部</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = '搜索...' }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
}

export function StatusBadge({ status }) {
  const statusMap = {
    '正常': { color: 'bg-green-100 text-green-700', icon: '✓' },
    '延期中': { color: 'bg-yellow-100 text-yellow-700', icon: '!' },
    '超期': { color: 'bg-red-100 text-red-700', icon: '✗' },
    '进行中': { color: 'bg-blue-100 text-blue-700', icon: '→' },
    '已完成': { color: 'bg-gray-100 text-gray-700', icon: '✓' },
    '入库发货': { color: 'bg-green-100 text-green-700', icon: '✓' },
    '物料采购': { color: 'bg-blue-100 text-blue-700', icon: '→' },
    '生产在制': { color: 'bg-yellow-100 text-yellow-700', icon: '!' },
    '技术提资': { color: 'bg-purple-100 text-purple-700', icon: '?' },
    '技术设计': { color: 'bg-indigo-100 text-indigo-700', icon: '?' },
    '安装调试': { color: 'bg-orange-100 text-orange-700', icon: '!' },
  };

  const config = statusMap[status] || { color: 'bg-gray-100 text-gray-700', icon: '•' };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <span>{config.icon}</span>
      {status}
    </span>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-sm text-gray-500">加载中...</span>
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-red-500 text-4xl mb-2">⚠</div>
      <p className="text-red-600 font-medium mb-2">加载失败</p>
      <p className="text-sm text-gray-500 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          重试
        </button>
      )}
    </div>
  );
}
