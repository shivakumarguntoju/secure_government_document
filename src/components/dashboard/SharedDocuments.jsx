// Shared Documents Component
import React, { useState, useEffect } from 'react';
import { Users, Download, Eye, Clock, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';
import DocumentService from '../../services/documentService';
import { DOCUMENT_TYPE_LABELS } from '../../constants';
import { formatFileSize, formatDateTime } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import DocumentViewer from './DocumentViewer';
import toast from 'react-hot-toast';

const SharedDocuments = () => {
  const { currentUser, userProfile } = useAuth();
  const [sharedDocs, setSharedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    if (currentUser && userProfile) {
      fetchSharedDocuments();
    }
  }, [currentUser, userProfile]);

  const fetchSharedDocuments = async () => {
    try {
      setLoading(true);
      const docs = await DocumentService.getSharedDocuments(
        userProfile.email,
        userProfile.aadhaarNumber
      );
      setSharedDocs(docs);
    } catch (error) {
      console.error('Failed to fetch shared documents:', error);
      toast.error('Failed to load shared documents');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (document) => {
    setSelectedDocument(document);
    setShowViewer(true);
  };

  const handleDownload = (document) => {
    if (document.permissions === 'view') {
      toast.error('You only have view permission for this document');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = document.fileUrl;
      link.download = document.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" text="Loading shared documents..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Shared Documents</h2>
            <p className="text-gray-600">Documents shared with you by family members</p>
          </div>
        </div>
      </div>

      {/* Shared Documents List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Documents Shared With You ({sharedDocs.length})
          </h3>
        </div>

        <div className="p-6">
          {sharedDocs.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No shared documents</h4>
              <p className="text-gray-600">
                When family members share documents with you, they will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedDocs.map((share) => (
                <div
                  key={share.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          Shared Document
                        </h4>
                        <p className="text-xs text-gray-500">
                          From: {share.ownerId}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      share.permissions === 'download' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {share.permissions === 'download' ? 'Can Download' : 'View Only'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDateTime(share.sharedAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="small"
                      icon={Eye}
                      onClick={() => handleView(share)}
                      className="flex-1"
                    >
                      View
                    </Button>
                    
                    {share.permissions === 'download' && (
                      <Button
                        variant="primary"
                        size="small"
                        icon={Download}
                        onClick={() => handleDownload(share)}
                        className="flex-1"
                      >
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showViewer && selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => {
            setShowViewer(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </div>
  );
};

export default SharedDocuments;