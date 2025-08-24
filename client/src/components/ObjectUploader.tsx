import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";

interface ObjectUploaderProps {
  maxFileSize?: number;
  onComplete?: (url: string) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * @param props - Component props
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onComplete - Callback function called when upload is complete
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxFileSize = 10485760, // 10MB default
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file?.name, file?.size);
    if (!file) return;

    if (file.size > maxFileSize) {
      setError(`File size must be less than ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    setSelectedFile(file);
    setError(null);
    console.log('File accepted and set');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Get upload URL
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL } = await response.json();
      console.log('Got upload URL:', uploadURL);

      // Upload file to the presigned URL
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      console.log('Upload response status:', uploadResponse.status);
      console.log('Upload response headers:', [...uploadResponse.headers.entries()]);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed with:', errorText);
        throw new Error(`Failed to upload file: ${uploadResponse.status} - ${errorText}`);
      }

      setUploadProgress(100);
      console.log('Upload successful');
      
      // Wait a moment for the upload to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use the object storage service to normalize the path correctly
      try {
        const normalizeResponse = await fetch('/api/objects/normalize-path', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uploadURL }),
        });
        
        if (!normalizeResponse.ok) {
          throw new Error('Failed to normalize object path');
        }
        
        const { objectPath } = await normalizeResponse.json();
        console.log('Upload URL:', uploadURL);
        console.log('Normalized object path:', objectPath);
        
        // Verify the file exists before proceeding
        const verifyResponse = await fetch(objectPath, { method: 'HEAD' });
        console.log('File verification status:', verifyResponse.status);
        
        // Close modal and reset state first
        setIsOpen(false);
        reset();
        
        // Then call completion callback
        onComplete?.(objectPath);
      } catch (normalizeError) {
        console.error('Path normalization error:', normalizeError);
        setError('Failed to process uploaded file');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const closeModal = () => {
    setIsOpen(false);
    reset();
  };

  return (
    <div>
      <Button 
        className={buttonClassName}
        onClick={() => {
          console.log('Upload button clicked, opening modal');
          setIsOpen(true);
        }}
      >
        {children}
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black dark:text-white">Upload Image</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
        
        <div className="space-y-4">
          {!selectedFile ? (
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mb-2"
              />
              <p className="text-sm text-gray-500">
                Maximum file size: {(maxFileSize / 1024 / 1024).toFixed(1)}MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded">
                <span className="text-sm font-medium truncate">
                  {selectedFile.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-racing-green h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-gray-600">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
              
              {!isUploading && (
                <Button 
                  onClick={handleUpload}
                  className="w-full"
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
              )}
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}