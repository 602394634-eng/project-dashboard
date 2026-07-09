import React, { useState } from 'react';
import { StatusBadge } from './UI.jsx';

export function ProjectDetail({ projectItems, onBack }) {
  if (!projectItems || projectItems.length === 0) return null;

  const mainProject = projectItems[0];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* 返回按钮 */}
      <button 
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回列表
      </button>

      {/* 项目基本信息 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{mainProject.name}</h2>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            工作令号: {mainProject.workOrder || 'N/A'}
          </span>
          <StatusBadge status={mainProject.stage} />
          {mainProject.isKey && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
              重点项目
            </span>
          )}
        </div>
      </div>

      {/* 项目详情 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-3">基本信息</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">项目经理</span>
              <span className="font-medium">{mainProject.pm || mainProject.projectManager || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">所属平台</span>
              <span className="font-medium">{mainProject.platform || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">产品类型</span>
              <span className="font-medium">{mainProject.productType || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">产品名称</span>
              <span className="font-medium">{mainProject.productName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">客供件</span>
              <span className="font-medium">{mainProject.hasCustomParts || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">是否试制</span>
              <span className="font-medium">{mainProject.isTrial || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-3">交付信息</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">数量</span>
              <span className="font-medium">{mainProject.quantity || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">交付日期</span>
              <span className="font-medium">{mainProject.deliveryDate || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">计划日期</span>
              <span className="font-medium">{mainProject.plannedDate || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">已完成</span>
              <span className="font-medium">{mainProject.completed || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 子项列表 */}
      {projectItems.length > 1 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">项目子项 ({projectItems.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-semibold">序号</th>
                  <th className="px-3 py-2 text-left font-semibold">产品类型</th>
                  <th className="px-3 py-2 text-left font-semibold">产品名称</th>
                  <th className="px-3 py-2 text-left font-semibold">数量</th>
                  <th className="px-3 py-2 text-left font-semibold">阶段</th>
                  <th className="px-3 py-2 text-left font-semibold">交付日期</th>
                </tr>
              </thead>
              <tbody>
                {projectItems.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-3 py-2">{item.seq || i + 1}</td>
                    <td className="px-3 py-2">{item.productType}</td>
                    <td className="px-3 py-2">{item.productName}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2"><StatusBadge status={item.stage} /></td>
                    <td className="px-3 py-2">{item.deliveryDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
