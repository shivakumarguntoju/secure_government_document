// Document Viewer Component with Database Integration
import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, Database, Eye, Clock, BarChart3 } from 'lucide-react';
import { DOCUMENT_TYPE_LABELS } from '../../constants';
import { formatFileSize, formatDateTime } from '../../utils/helpers';
import DocumentService from '../../services/documentService';
import { useAuth } from '../../hooks/useAuth.jsx';
import Modal from '../common/Modal';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const DocumentViewer = ({ document, onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [documentData, setDocumentData] = useState(document);

  const isImage = document.fileType.startsWith('image/');
  const isPDF = document.fileType === 'application/pdf';

  useEffect(() => {
    // Refresh document data from database when viewer opens
    refreshDocumentData();
  }, [document.id]);

  const refreshDocumentData = async () => {
    try {
      setLoading(true);
      const freshDoc = await DocumentService.getDocument(document.id, currentUser.uid);
      setDocumentData(freshDoc);
    } catch (error) {
      console.error('Failed to refresh document data:', error);
      toast.error('Failed to load latest document data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await DocumentService.downloadDocument(documentData.id, currentUser.uid);
      toast.success('Download started and tracked in database');
      // Refresh to get updated download count
      await refreshDocumentData();
    } catch (error) {
      toast.error(error.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenExternal = () => {
    window.open(documentData.fileUrl, '_blank', 'noopener,noreferrer');
    toast.success('Document opened in new tab');
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`${documentData.fileName} - Database Viewer`}
      size="xlarge"
    >
      <div className="space-y-6">
        {/* Document Database Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Database Record</h3>
                <p className="text-sm text-gray-600">
                  Document ID: <code className="bg-white px-2 py-1 rounded text-xs">{documentData.id}</code>
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {DOCUMENT_TYPE_LABELS[documentData.documentType]}
              </p>
              <p className="text-xs text-gray-500">{documentData.fileType}</p>
            </div>
          </div>
        </div>

        {/* Document Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xs text-gray-500">Downloads</p>
            <p className="text-lg font-bold text-gray-900">{documentData.downloadCount || 0}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500">File Size</p>
            <p className="text-sm font-bold text-gray-900">{formatFileSize(documentData.fileSize)}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500">Uploaded</p>
            <p className="text-xs font-medium text-gray-900">
              {documentData.uploadedAt.toLocaleDateString()}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500">Last Accessed</p>
            <p className="text-xs font-medium text-gray-900">
              {formatDateTime(documentData.lastAccessed)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            icon={Download}
            onClick={handleDownload}
            loading={downloading}
            className="flex-1 sm:flex-none"
          >
            Download & Track
          </Button>
          
          <Button
            variant="outline"
            icon={ExternalLink}
            onClick={handleOpenExternal}
            className="flex-1 sm:flex-none"
          >
            Open in New Tab
          </Button>
          
          <Button
            variant="outline"
            icon={Database}
            onClick={refreshDocumentData}
            loading={loading}
            className="flex-1 sm:flex-none"
          >
            Refresh from DB
          </Button>
        </div>

        {/* Document Preview */}
        <div className="bg-gray-50 rounded-lg overflow-hidden border-2 border-gray-200" style={{ height: '500px' }}>
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <LoadingSpinner size="large" text="Loading from database..." />
            </div>
          ) : isImage ? (
            <div className="h-full flex items-center justify-center p-4">
              <img
                src={documentData.fileUrl}
                alt={documentData.fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                onLoad={() => toast.success('Image loaded from database')}
                onError={() => toast.error('Failed to load image')}
              />
            </div>
          ) : isPDF ? (
            <iframe
              src={`${documentData.fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full border-0"
              title={documentData.fileName}
              onLoad={() => toast.success('PDF loaded from database')}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Preview not available
                </h3>
                <p className="text-gray-600 mb-4">
                  This file type cannot be previewed in the browser.
                </p>
                <Button
                  variant="primary"
                  icon={Download}
                  onClick={handleDownload}
                  loading={downloading}
                >
                  Download from Database
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Document Metadata from Database */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Database className="w-4 h-4 mr-2" />
            Database Metadata
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Storage Path:</p>
              <p className="font-mono text-xs text-gray-900 bg-white px-2 py-1 rounded">
                {documentData.storagePath}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Status:</p>
              <p className="font-medium text-green-600 capitalize">{documentData.status}</p>
            </div>
            <div>
              <p className="text-gray-500">Last Updated:</p>
              <p className="text-gray-900">{formatDateTime(documentData.updatedAt)}</p>
            </div>
            <div>
              <p className="text-gray-500">Shared Status:</p>
              <p className="text-gray-900">{documentData.isShared ? 'Yes' : 'No'}</p>
            </div>
          </div>
          
          {documentData.description && (
            <div className="mt-4">
              <p className="text-gray-500 mb-1">Description:</p>
              <p className="text-gray-900 bg-white p-3 rounded border">{documentData.description}</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DocumentViewer;