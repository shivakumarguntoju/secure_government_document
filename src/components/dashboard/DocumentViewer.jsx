// Document Viewer Component
import React from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { DOCUMENT_TYPE_LABELS } from '../../constants';
import { formatFileSize } from '../../utils/validation';
import Modal from '../common/Modal';
import Button from '../common/Button';

const DocumentViewer = ({ document, onClose }) => {
  const isImage = document.fileType.startsWith('image/');
  const isPDF = document.fileType === 'application/pdf';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenExternal = () => {
    window.open(document.fileUrl, '_blank');
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={document.fileName}
      size="xlarge"
    >
      <div className="space-y-4">
        {/* Document Info */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 capitalize">
              {DOCUMENT_TYPE_LABELS[document.documentType]} • {document.fileType}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Size: {formatFileSize(document.fileSize)} • 
              Uploaded: {document.uploadedAt.toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="small"
              icon={Download}
              onClick={handleDownload}
            >
              Download
            </Button>
            
            <Button
              variant="outline"
              size="small"
              icon={ExternalLink}
              onClick={handleOpenExternal}
            >
              Open in New Tab
            </Button>
          </div>
        </div>

        {/* Document Preview */}
        <div className="bg-gray-50 rounded-lg overflow-hidden" style={{ height: '500px' }}>
          {isImage ? (
            <div className="h-full flex items-center justify-center p-4">
              <img
                src={document.fileUrl}
                alt={document.fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-md"
              />
            </div>
          ) : isPDF ? (
            <iframe
              src={`${document.fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full border-0"
              title={document.fileName}
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
                >
                  Download to view
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Document Description */}
        {document.description && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
            <p className="text-sm text-gray-700">{document.description}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DocumentViewer;