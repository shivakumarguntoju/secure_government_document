// Document List Component with Database Operations
import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Share, 
  Trash2, 
  Edit,
  Eye,
  Filter,
  Search,
  Database,
  Clock
} from 'lucide-react';
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from '../../constants';
import { useAuth } from '../../hooks/useAuth.jsx';
import useDocuments from '../../hooks/useDocuments.jsx';
import DocumentService from '../../services/documentService';
import { formatFileSize } from '../../utils/validation';
import { truncateText, formatDateTime } from '../../utils/helpers';
import Button from '../common/Button';
import Input from '../common/Input';
import DocumentViewer from './DocumentViewer';
import DocumentShare from './DocumentShare';
import DocumentEdit from './DocumentEdit';
import ConfirmDialog from '../common/ConfirmDialog';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const DocumentList = ({ documents, onDocumentUpdated, onDocumentDeleted }) => {
  const { currentUser } = useAuth();
  const { deleteDocument } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState({});

  const documentTypes = [
    { value: 'all', label: 'All Documents' },
    ...Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || doc.documentType === selectedType;
    return matchesSearch && matchesType;
  });

  const handleView = async (document) => {
    try {
      // Get fresh document data from database
      const freshDoc = await DocumentService.getDocument(document.id, currentUser.uid);
      setSelectedDocument(freshDoc);
      setShowViewer(true);
      toast.success('Document loaded from database');
    } catch (error) {
      toast.error(error.message || 'Failed to load document');
    }
  };

  const handleShare = (document) => {
    setSelectedDocument(document);
    setShowShare(true);
  };

  const handleEdit = (document) => {
    setSelectedDocument(document);
    setShowEdit(true);
  };

  const handleDownload = async (document) => {
    setDownloading(prev => ({ ...prev, [document.id]: true }));
    
    try {
      await DocumentService.downloadDocument(document.id, currentUser.uid);
      toast.success('Download started - tracked in database');
    } catch (error) {
      toast.error(error.message || 'Download failed');
    } finally {
      setDownloading(prev => ({ ...prev, [document.id]: false }));
    }
  };

  const handleDelete = async (document) => {
    setSelectedDocument(document);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteDocument(selectedDocument.id, selectedDocument.storagePath);
      toast.success('Document deleted from database successfully');
      setShowDeleteConfirm(false);
      setSelectedDocument(null);
      onDocumentDeleted();
    } catch (error) {
      toast.error(error.message || 'Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  const getDocumentIcon = (documentType) => {
    const iconClass = "w-5 h-5";
    
    const iconColors = {
      [DOCUMENT_TYPES.AADHAAR]: 'text-blue-600',
      [DOCUMENT_TYPES.PAN]: 'text-green-600',
      [DOCUMENT_TYPES.PASSPORT]: 'text-purple-600',
      [DOCUMENT_TYPES.MARKSHEET]: 'text-orange-600',
      [DOCUMENT_TYPES.OTHER]: 'text-gray-600'
    };

    return <FileText className={`${iconClass} ${iconColors[documentType] || 'text-gray-600'}`} />;
  };

  if (!documents) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" text="Loading documents from database..." />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Document Database</h3>
              <p className="text-sm text-gray-600">{filteredDocuments.length} documents stored</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search */}
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              className="w-full sm:w-64"
            />
            
            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white w-full sm:w-48"
              >
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Document Grid */}
      <div className="p-6">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No documents found</h4>
            <p className="text-gray-600">
              {searchTerm || selectedType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Upload your first document to the database to get started'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-gray-50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {getDocumentIcon(document.documentType)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {document.fileName}
                      </h4>
                      <p className="text-xs text-gray-500 capitalize">
                        {DOCUMENT_TYPE_LABELS[document.documentType]}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1">
                    {document.isShared && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Shared
                      </span>
                    )}
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      <Database className="w-3 h-3 mr-1" />
                      DB Stored
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {truncateText(document.description, 80)}
                </p>

                <div className="space-y-2 text-xs text-gray-500 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDateTime(document.uploadedAt)}
                    </span>
                    <span>{formatFileSize(document.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Downloads: {document.downloadCount || 0}</span>
                    <span>ID: {document.id.slice(0, 8)}...</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="small"
                      icon={Eye}
                      onClick={() => handleView(document)}
                      className="p-2 text-blue-600 hover:bg-blue-50"
                      title="View from Database"
                    />
                    
                    <Button
                      variant="ghost"
                      size="small"
                      icon={Download}
                      onClick={() => handleDownload(document)}
                      loading={downloading[document.id]}
                      className="p-2 text-green-600 hover:bg-green-50"
                      title="Download & Track"
                    />
                    
                    <Button
                      variant="ghost"
                      size="small"
                      icon={Share}
                      onClick={() => handleShare(document)}
                      className="p-2 text-purple-600 hover:bg-purple-50"
                      title="Share Document"
                    />
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="small"
                      icon={Edit}
                      onClick={() => handleEdit(document)}
                      className="p-2 text-orange-600 hover:bg-orange-50"
                      title="Edit Metadata"
                    />
                    
                    <Button
                      variant="ghost"
                      size="small"
                      icon={Trash2}
                      onClick={() => handleDelete(document)}
                      className="p-2 text-red-600 hover:bg-red-50"
                      title="Delete from Database"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showViewer && selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => {
            setShowViewer(false);
            setSelectedDocument(null);
          }}
        />
      )}

      {showShare && selectedDocument && (
        <DocumentShare
          document={selectedDocument}
          onClose={() => {
            setShowShare(false);
            setSelectedDocument(null);
          }}
          onShared={onDocumentUpdated}
        />
      )}

      {showEdit && selectedDocument && (
        <DocumentEdit
          document={selectedDocument}
          onClose={() => {
            setShowEdit(false);
            setSelectedDocument(null);
          }}
          onUpdated={onDocumentUpdated}
        />
      )}

      {showDeleteConfirm && selectedDocument && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => {
            setShowDeleteConfirm(false);
            setSelectedDocument(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Document from Database"
          message={`Are you sure you want to permanently delete "${selectedDocument.fileName}" from the database? This action cannot be undone and will remove both the file and all metadata.`}
          confirmText="Delete from Database"
          loading={deleting}
        />
      )}
    </div>
  );
};

export default DocumentList;