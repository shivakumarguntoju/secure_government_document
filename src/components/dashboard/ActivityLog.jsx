// Activity Log Component
import React, { useState, useEffect } from 'react';
import { Activity, Clock, FileText, Users, Shield, Filter } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { formatDateTime } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

const ActivityLog = () => {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (currentUser) {
      fetchActivities();
    }
  }, [currentUser, filter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'activityLogs'),
        where('userId', '==', currentUser.uid),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      if (filter !== 'all') {
        q = query(q, where('action', '==', filter));
      }

      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      }));

      setActivities(logs);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    const iconClass = "w-4 h-4";
    
    switch (action) {
      case 'LOGIN':
      case 'LOGOUT':
        return <Shield className={`${iconClass} text-blue-600`} />;
      case 'UPLOAD_DOCUMENT':
      case 'UPDATE_DOCUMENT':
      case 'DELETE_DOCUMENT':
        return <FileText className={`${iconClass} text-green-600`} />;
      case 'SHARE_DOCUMENT':
        return <Users className={`${iconClass} text-purple-600`} />;
      default:
        return <Activity className={`${iconClass} text-gray-600`} />;
    }
  };

  const getActivityColor = (action) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-green-100 border-green-200';
      case 'LOGOUT':
        return 'bg-blue-100 border-blue-200';
      case 'UPLOAD_DOCUMENT':
        return 'bg-purple-100 border-purple-200';
      case 'SHARE_DOCUMENT':
        return 'bg-orange-100 border-orange-200';
      case 'DELETE_DOCUMENT':
        return 'bg-red-100 border-red-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Activities' },
    { value: 'LOGIN', label: 'Login Events' },
    { value: 'UPLOAD_DOCUMENT', label: 'Document Uploads' },
    { value: 'SHARE_DOCUMENT', label: 'Document Shares' },
    { value: 'DELETE_DOCUMENT', label: 'Document Deletions' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" text="Loading activity log..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Activity Log</h2>
              <p className="text-gray-600">Track all your account activities</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activities</h3>
        
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No activities found</h4>
            <p className="text-gray-600">
              {filter === 'all' ? 'Start using the platform to see your activities here' : 'No activities match the selected filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start space-x-4 p-4 rounded-lg border ${getActivityColor(activity.action)}`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDateTime(activity.timestamp)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mt-1">{activity.details}</p>
                  
                  {activity.ipAddress && (
                    <p className="text-xs text-gray-500 mt-2">
                      IP: {activity.ipAddress}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;