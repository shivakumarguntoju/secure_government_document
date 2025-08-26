// Dashboard Component
import React, { useState, useEffect } from 'react';
import { FileText, Upload, Users, Activity, TrendingUp, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';
import useDocuments from '../../hooks/useDocuments.jsx';
import DocumentService from '../../services/documentService';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import DocumentList from './DocumentList';
import DocumentUpload from './DocumentUpload';
import { formatFileSize } from '../../utils/validation';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { documents, loading: documentsLoading, fetchDocuments } = useDocuments();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    sharedDocuments: 0,
    recentUploads: 0,
    storageUsed: 0
  });
  const [showUpload, setShowUpload] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser, documents]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const statistics = await DocumentService.getDocumentStats(currentUser.uid);
      setStats(statistics);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDocumentUploaded = () => {
    setShowUpload(false);
    fetchDocuments();
    fetchStats();
  };

  const statCards = [
    {
      title: 'Total Documents',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'blue',
      description: 'All uploaded documents'
    },
    {
      title: 'Shared Documents',
      value: stats.sharedDocuments,
      icon: Users,
      color: 'green',
      description: 'Documents shared with family'
    },
    {
      title: 'Recent Uploads',
      value: stats.recentUploads,
      icon: TrendingUp,
      color: 'orange',
      description: 'Last 30 days'
    },
    {
      title: 'Storage Used',
      value: formatFileSize(stats.storageUsed),
      icon: Shield,
      color: 'purple',
      description: 'Secure cloud storage'
    }
  ];

  if (documentsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Document Dashboard</h2>
            <p className="text-gray-600 mt-1">Manage your secure government documents</p>
          </div>
          <Button
            variant="primary"
            icon={Upload}
            onClick={() => setShowUpload(true)}
          >
            Upload Document
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600 border-blue-200',
            green: 'bg-green-100 text-green-600 border-green-200',
            orange: 'bg-orange-100 text-orange-600 border-orange-200',
            purple: 'bg-purple-100 text-purple-600 border-purple-200'
          };

          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {documents.slice(0, 5).map((doc) => (
            <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                  <p className="text-xs text-gray-500 capitalize">{doc.documentType} • {doc.fileType}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {doc.uploadedAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {documents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No documents uploaded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Documents List */}
      <DocumentList
        documents={documents}
        onDocumentUpdated={fetchDocuments}
        onDocumentDeleted={fetchDocuments}
      />

      {/* Upload Modal */}
      {showUpload && (
        <DocumentUpload
          onClose={() => setShowUpload(false)}
          onUploadComplete={handleDocumentUploaded}
        />
      )}
    </div>
  );
};

export default Dashboard;