// FIX: Implemented the ImageUploader component to handle file uploads, previews, and removals.
// FIX: Added 'useEffect' to the React import to resolve the "Cannot find name 'useEffect'" error.
import React, { useCallback, useState, DragEvent, useEffect } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { TrashIcon } from './icons/TrashIcon';
import type { ImageData } from '../types';

interface ImageUploaderProps {
  onUpload: (images: ImageData[]) => void;
  label: string;
  multiple?: boolean;
  className?: string;
  uploadedImages: ImageData[];
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUpload,
  label,
  multiple = false,
  className = '',
  uploadedImages = [],
}) => {
  const [previews, setPreviews] = useState<string[]>(uploadedImages.map(img => `data:${img.mimeType};base64,${img.base64}`));
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileRead = (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        if (base64) {
          resolve({ base64, mimeType: file.type });
        } else {
          reject(new Error('Failed to read file as base64.'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const acceptedFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      const imageDatas = await Promise.all(acceptedFiles.map(handleFileRead));
      const newPreviews = imageDatas.map(img => `data:${img.mimeType};base64,${img.base64}`);

      if (multiple) {
        onUpload([...uploadedImages, ...imageDatas]);
        setPreviews(prev => [...prev, ...newPreviews]);
      } else {
        onUpload(imageDatas.slice(0, 1));
        setPreviews(newPreviews.slice(0, 1));
      }
    } catch (error) {
      console.error("Error reading files:", error);
      alert("There was an error processing your images. Please try again.");
    }
  }, [onUpload, multiple, uploadedImages]);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    processFiles(e.target.files);
  };
  
  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const removeImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    onUpload(newImages);

    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };
  
  useEffect(() => {
    setPreviews(uploadedImages.map(img => `data:${img.mimeType};base64,${img.base64}`));
  }, [uploadedImages]);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-indigo-500 transition-colors ${isDragActive ? 'border-indigo-500 bg-gray-800' : ''}`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple={multiple} onChange={handleChange} className="hidden" />
        <div className="space-y-1 text-center">
          <UploadIcon />
          <div className="flex text-sm text-gray-400">
            <p className="pl-1">{isDragActive ? 'Thả file vào đây' : 'Kéo thả hoặc nhấn để chọn file'}</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, JPEG</p>
        </div>
      </div>
      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          {previews.map((src, index) => (
            <div key={index} className="relative group">
              <img src={src} alt={`Preview ${index}`} className="h-24 w-full object-cover rounded-md" />
              <button
                onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};