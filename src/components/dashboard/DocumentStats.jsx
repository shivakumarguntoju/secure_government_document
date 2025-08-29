// Document Statistics Component
import React from 'react';
import { BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react';
import { DOCUMENT_TYPE_LABELS } from '../../constants';
import { formatFileSize } from '../../utils/validation';

const DocumentStats = ({ stats }) => {
  const chartData = Object.entries(stats.documentsByType || {}).map(([type, count]) => ({
    type: DOCUMENT_TYPE_LABELS[type] || type,
    count,
    percentage: Math.round((count / stats.totalDocuments) * 100)
  }));

  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart3 className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Document Statistics</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Type Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
            <PieChart className="w-4 h-4 mr-2" />
            Document Types
          </h4>
          
          {chartData.length > 0 ? (
            <div className="space-y-3">
              {chartData.map((item, index) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                    <span className="text-sm text-gray-700">{item.type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                    <span className="text-xs text-gray-500">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No documents to analyze</p>
          )}
        </div>

        {/* Storage Usage */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Storage Usage
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Total Storage Used</span>
              <span className="text-sm font-medium text-gray-900">
                {formatFileSize(stats.storageUsed)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Average File Size</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.totalDocuments > 0 
                  ? formatFileSize(stats.storageUsed / stats.totalDocuments)
                  : '0 Bytes'
                }
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Recent Uploads (30 days)</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.recentUploads}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentStats;