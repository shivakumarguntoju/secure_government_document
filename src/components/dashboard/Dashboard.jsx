// Dashboard Component with Complete Database Integration
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Users, 
  Activity, 
  TrendingUp, 
  Shield, 
  Share,
  Database,
  BarChart3,
  Search
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';
import useDocuments from '../../hooks/useDocuments.jsx';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import Input from '../common/Input';
import DocumentList from './DocumentList';
import DocumentUpload from './DocumentUpload';
import SharedDocuments from './SharedDocuments';
import DocumentStats from './DocumentStats';
import { formatFileSize } from '../../utils/validation';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const { 
    documents, 
    loading: documentsLoading, 
    fetchDocuments,
    searchDocuments,
    stats
  } = useDocuments();
  const [activeTab, setActiveTab] = useState('my-documents');
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchRecentActivity();
    }
  }, [currentUser]);

  const fetchRecentActivity = async () => {
    try {
      setActivityLoading(true);
      
      // Fetch recent activity from database
      const q = query(
        collection(db, 'activityLogs'),
        where('userId', '==', currentUser.uid),
        where('action', 'in', ['UPLOAD_DOCUMENT', 'DOWNLOAD_DOCUMENT', 'VIEW_DOCUMENT', 'DELETE_DOCUMENT']),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
      }));
      
      setRecentActivity(activities);
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      setRecentActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleDocumentUploaded = () => {
    setShowUpload(false);
    fetchDocuments();
    fetchRecentActivity();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchDocuments();
      return;
    }

    setSearching(true);
    try {
      await searchDocuments(searchTerm);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchDocuments();
  };

  const tabs = [
    { id: 'my-documents', label: 'My Documents', icon: FileText },
    { id: 'shared-with-me', label: 'Shared With Me', icon: Share }
  ];

  const statCards = [
    {
      title: 'Total Documents',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'blue',
      description: 'Stored in database'
    },
    {
      title: 'Shared Documents',
      value: stats.sharedDocuments,
      icon: Users,
      color: 'green',
      description: 'Shared with family'
    },
    {
      title: 'Total Downloads',
      value: stats.totalDownloads || 0,
      icon: TrendingUp,
      color: 'orange',
      description: 'Tracked downloads'
    },
    {
      title: 'Storage Used',
      value: formatFileSize(stats.storageUsed),
      icon: Shield,
      color: 'purple',
      description: 'Database storage'
    }
  ];

  if (documentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" text="Loading documents from database..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Document Database</h2>
              <p className="text-blue-100 mt-1">Secure cloud storage and management</p>
            </div>
          </div>
          {activeTab === 'my-documents' && (
            <Button
              variant="outline"
              icon={Upload}
              onClick={() => setShowUpload(true)}
              className="bg-white text-blue-600 border-white hover:bg-blue-50"
            >
              Upload to Database
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {activeTab === 'my-documents' && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search documents in database..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              loading={searching}
              disabled={!searchTerm.trim()}
            >
              Search DB
            </Button>
            {searchTerm && (
              <Button
                type="button"
                variant="outline"
                onClick={clearSearch}
              >
                Clear
              </Button>
            )}
          </form>
        </div>
      )}

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
              className="bg-white rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition-all duration-200"
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

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Recent Database Activity */}
      {activeTab === 'my-documents' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Database Activity</h3>
          </div>
          
          {activityLoading ? (
            <LoadingSpinner size="medium" text="Loading activity..." />
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500">{activity.details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {activity.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent database activity</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Documents Content */}
      {activeTab === 'my-documents' ? (
        <>
          <DocumentStats stats={stats} />
          <DocumentList
            documents={documents}
            onDocumentUpdated={fetchDocuments}
            onDocumentDeleted={fetchDocuments}
          />
        </>
      ) : (
        <SharedDocuments />
      )}

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