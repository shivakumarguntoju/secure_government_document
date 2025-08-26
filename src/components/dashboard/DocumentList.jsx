// Document List Component
import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Share, 
  Trash2, 
  Edit,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from '../../constants';
import { useAuth } from '../../hooks/useAuth.jsx';
import useDocuments from '../../hooks/useDocuments.jsx';
import { formatFileSize } from '../../utils/validation';
import { truncateText } from '../../utils/helpers';
import Button from '../common/Button';
import Input from '../common/Input';
import DocumentViewer from './DocumentViewer';
import DocumentShare from './DocumentShare';
import toast from 'react-hot-toast';

const DocumentList = ({ documents, onDocumentUpdated, onDocumentDeleted }) => {
  const { currentUser } = useAuth();
  const { deleteDocument } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showShare, setShowShare] = useState(false);

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

  const handleView = (document) => {
    setSelectedDocument(document);
    setShowViewer(true);
  };

  const handleShare = (document) => {
    setSelectedDocument(document);
    setShowShare(true);
  };

  const handleDownload = (document) => {
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

  const handleDelete = async (document) => {
    if (!window.confirm(`Are you sure you want to delete "${document.fileName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDocument(document.id, document.storagePath);
      toast.success('Document deleted successfully');
      onDocumentDeleted();
    } catch (error) {
      toast.error('Failed to delete document');
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

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">My Documents</h3>
            <p className="text-sm text-gray-600">{filteredDocuments.length} documents found</p>
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
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No documents found</h4>
            <p className="text-gray-600">
              {searchTerm || selectedType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Upload your first document to get started'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
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
                  
                  {document.isShared && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Shared
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {truncateText(document.description, 80)}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{document.uploadedAt.toLocaleDateString()}</span>
                  <span>{formatFileSize(document.fileSize)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="small"
                      icon={Eye}
                      onClick={() => handleView(document)}
                      className="p-2"
                      title="View"
                    />
                    
                    <Button
                      variant="ghost"
                      size="small"
                      icon={Download}
                      onClick={() => handleDownload(document)}
                      className="p-2 text-green-600 hover:bg-green-50"
                      title="Download"
                    />
                    
                    <Button
                      variant="ghost"
                      size="small"
                      icon={Share}
                      onClick={() => handleShare(document)}
                      className="p-2 text-purple-600 hover:bg-purple-50"
                      title="Share"
                    />
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="small"
                      icon={Edit}
                      onClick={() => {/* Handle edit */}}
                      className="p-2 text-orange-600 hover:bg-orange-50"
                      title="Edit"
                    />
                    
                    <Button
                      variant="ghost"
                      size="small"
                      icon={Trash2}
                      onClick={() => handleDelete(document)}
                      className="p-2 text-red-600 hover:bg-red-50"
                      title="Delete"
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
    </div>
  );
};

export default DocumentList;