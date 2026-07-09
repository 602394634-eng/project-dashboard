import React from 'react';
import { StatCard, LoadingSpinner } from './UI.jsx';
import { extractProductionData, extractTrialData } from '../data/processor.js';

export function MeetingTab({ data }) {
  if (!data) return <LoadingSpinner />;

  const { sheet2, sheet13, exceptions } = data;
  
  // 产供销完成情况
  const productionData = extractProductionData(sheet2);
  
  // 试制数据
  const trialData = extractTrialData(sheet13);
  
  // 未闭环的重大/中等异常
  const openCriticalExceptions = exceptions.filter(e => {
    const desc = (e.description || '').toLowerCase();
    const isOpen = !desc.includes('已闭环') && !desc.includes('闭环');
    const level = (e.level || '').toLowerCase();
    const isCritical = level.includes('重大') || level.includes('中等');
    return isOpen && isCritical;
  });

  return (
    <div className="space-y-6">
      {/* 第一部分：产供销完成情况 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">一、产供销完成情况</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard title="本月生产计划" value="777台" color="blue" />
          <StatCard title="累计完成" value="299台" color="green" />
          <StatCard title="完成率" value="38.5%" color="yellow" />
          <StatCard title="本月计划销售" value="258台" color="purple" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-3 py-2 text-left font-semibold">二级产品线</th>
                <th className="px-3 py-2 text-left font-semibold">产品类型</th>
                <th className="px-3 py-2 text-left font-semibold">本月计划</th>
                <th className="px-3 py-2 text-left font-semibold">累计完成</th>
                <th className="px-3 py-2 text-left font-semibold">完成率</th>
                <th className="px-3 py-2 text-left font-semibold">异常说明</th>
              </tr>
            </thead>
            <tbody>
              {productionData.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-medium">{item.productLine}</td>
                  <td className="px-3 py-2">{item.productType}</td>
                  <td className="px-3 py-2">{item.monthlyPlan}</td>
                  <td className="px-3 py-2">{item.completed}</td>
                  <td className="px-3 py-2">
                    <span className={`font-medium ${
                      parseFloat(item.completionRate) >= 80 ? 'text-green-600' :
                      parseFloat(item.completionRate) >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {item.completionRate}
                    </span>
                  </td>
                  <td className="px-3 py-2 max-w-xs truncate" title={item.exception}>{item.exception}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 第二部分：试制专项 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">二、试制专项</h2>
        
        <div className="mb-4 text-sm text-gray-600">
          <p>共梳理 <strong>14个</strong> 试制项目（箱变13个 + 成套1个），暂定 <strong>9个</strong> 开展试制</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-3 py-2 text-left font-semibold">序号</th>
                <th className="px-3 py-2 text-left font-semibold">项目名称</th>
                <th className="px-3 py-2 text-left font-semibold">是否重点</th>
                <th className="px-3 py-2 text-left font-semibold">项目阶段</th>
                <th className="px-3 py-2 text-left font-semibold">试制策略</th>
                <th className="px-3 py-2 text-left font-semibold">项目经理</th>
              </tr>
            </thead>
            <tbody>
              {trialData.slice(0, 15).map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-3 py-2">{item.seq}</td>
                  <td className="px-3 py-2 font-medium">{item.name}</td>
                  <td className="px-3 py-2">{item.isKey}</td>
                  <td className="px-3 py-2">{item.stage}</td>
                  <td className="px-3 py-2">{item.strategy}</td>
                  <td className="px-3 py-2">{item.pm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 第三部分：项目异常（未闭环的重大/中等异常） */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">三、项目异常（未闭环的重大/中等异常）</h2>
        
        <div className="mb-4">
          <StatCard 
            title="未闭环重大/中等异常" 
            value={openCriticalExceptions.length} 
            color="red" 
            icon="🚨"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-3 py-2 text-left font-semibold">项目名称</th>
                <th className="px-3 py-2 text-left font-semibold">产品类型</th>
                <th className="px-3 py-2 text-left font-semibold">项目经理</th>
                <th className="px-3 py-2 text-left font-semibold">异常阶段</th>
                <th className="px-3 py-2 text-left font-semibold">等级</th>
                <th className="px-3 py-2 text-left font-semibold">异常描述</th>
                <th className="px-3 py-2 text-left font-semibold">解决措施</th>
              </tr>
            </thead>
            <tbody>
              {openCriticalExceptions.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-medium">{item.projectName}</td>
                  <td className="px-3 py-2">{item.productType}</td>
                  <td className="px-3 py-2">{item.pm}</td>
                  <td className="px-3 py-2">{item.exceptionStage}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.level?.includes('重大') ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {item.level}
                    </span>
                  </td>
                  <td className="px-3 py-2 max-w-xs truncate" title={item.description}>{item.description}</td>
                  <td className="px-3 py-2 max-w-xs truncate" title={item.solution}>{item.solution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
