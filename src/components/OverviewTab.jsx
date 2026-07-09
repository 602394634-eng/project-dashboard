import React, { useState, useMemo } from 'react';
import { StatCard, LineChart, PieChart, LoadingSpinner, StatusBadge } from './UI.jsx';
import { computeOverviewStats } from '../data/processor.js';

export function OverviewTab({ data }) {
  if (!data) return <LoadingSpinner />;

  const { projects, productionData, exceptions } = data;
  const stats = useMemo(() => computeOverviewStats(projects, productionData, exceptions), [projects, productionData, exceptions]);

  // 模拟月度数据（实际应从年度产供销完成情况sheet获取）
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月'];
  
  // 需求兑现率（模拟数据）
  const fulfillmentRate = [45, 52, 58, 65, 72, 68, 75];
  
  // 提资率、BOM下发率、物料齐套率（模拟数据）
  const tiziRate = [60, 65, 70, 75, 80, 78, 82];
  const bomRate = [55, 60, 68, 72, 78, 75, 80];
  const wuliaoRate = [50, 55, 62, 68, 72, 70, 75];

  const stageData = Object.entries(stats.stageCounts)
    .filter(([_, count]) => count > 0)
    .map(([stage, count]) => ({ name: stage, value: count }));

  const pmData = Object.entries(stats.pmStats)
    .map(([pm, stat]) => ({ name: pm, projectCount: stat.projectCount, subItemCount: stat.subItemCount }));

  return (
    <div className="space-y-6">
      {/* 核心指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard title="项目总数" value={stats.totalProjects} color="blue" icon="📁" />
        <StatCard title="子项总数" value={stats.totalSubItems} color="purple" icon="📋" />
        <StatCard title="已交付" value={stats.deliveredCount} color="green" icon="✅" />
        <StatCard title="异常总数" value={stats.totalExceptions} color="red" icon="⚠️" />
        <StatCard title="未闭环异常" value={stats.openExceptions} color="yellow" icon="🔔" />
        <StatCard title="重大异常" value={stats.criticalExceptions} color="red" icon="🚨" />
      </div>

      {/* 各环节项目分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">项目阶段分布</h3>
          <PieChart data={stageData} title="各阶段项目数" height={280} />
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">产品线分布</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(stats.productLineStats).map(([line, count]) => (
              <div key={line} className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-500">{line}</div>
                <div className="text-xl font-bold text-gray-800">{count} <span className="text-sm font-normal text-gray-400">个子项</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 趋势图表 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">月度趋势</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChart
            xAxis={months}
            series={[{ name: '需求兑现率', data: fulfillmentRate, color: '#3b82f6' }]}
            title="需求兑现率趋势"
            height={250}
          />
          <LineChart
            xAxis={months}
            series={[
              { name: '提资率', data: tiziRate, color: '#8b5cf6' },
              { name: 'BOM下发率', data: bomRate, color: '#f59e0b' },
              { name: '物料齐套率', data: wuliaoRate, color: '#10b981' },
            ]}
            title="提资/BOM/物料齐套率趋势"
            height={250}
          />
        </div>
      </div>

      {/* 项目经理统计 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">项目经理负责情况</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-3 py-2 text-left font-semibold">项目经理</th>
                <th className="px-3 py-2 text-left font-semibold">负责项目数</th>
                <th className="px-3 py-2 text-left font-semibold">子项数</th>
              </tr>
            </thead>
            <tbody>
              {pmData.map((pm) => (
                <tr key={pm.name} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-medium">{pm.name}</td>
                  <td className="px-3 py-2">{pm.projectCount}</td>
                  <td className="px-3 py-2">{pm.subItemCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
