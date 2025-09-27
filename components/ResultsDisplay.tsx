import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ZoomIcon } from './icons/ZoomIcon';
import { LOADING_MESSAGES } from '../constants';
import type { AppMode } from '../types';
import { ImageModal } from './ImageModal';
import { CreateVideoIcon } from './icons/CreateVideoIcon';

interface ResultsDisplayProps {
  isLoading: boolean;
  results: string[];
  mode: AppMode;
  onCreateVideo: (base64: string, mimeType: string) => void;
}

const WelcomeState: React.FC<{mode: AppMode}> = ({mode}) => {
  const getTitle = () => {
    switch (mode) {
      case 'edit': return 'Sẵn sàng biến hoá nhân vật của bạn';
      case 'swap': return 'Hoán đổi khuôn mặt nghệ thuật';
      case 'generate': return 'Sẵn sàng tạo nên kiệt tác';
      case 'magic': return 'Bộ công cụ chỉnh sửa ảnh AI';
      case 'analyze': return 'Phân tích hình ảnh bằng AI';
      case 'video': return 'Tạo video chuyển động từ ý tưởng';
      default: return '';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'edit': return 'Tải lên ảnh nhân vật và sản phẩm, sau đó mô tả yêu cầu của bạn để bắt đầu.';
      case 'swap': return 'Tải ảnh khuôn mặt gốc và ảnh đích để AI thực hiện phép màu hoán đổi.';
      case 'generate': return 'Viết một mô tả chi tiết và chọn tỷ lệ khung hình để AI tạo ra 4 kết quả độc đáo.';
      case 'magic': return 'Tải lên một ảnh và chọn một thao tác nhanh: nâng cấp, xóa nền, hoặc tự động sửa màu.';
      case 'analyze': return 'Tải lên một hình ảnh và AI sẽ cung cấp một mô tả chi tiết, hoàn hảo để sử dụng làm prompt.';
      case 'video': return 'Viết mô tả, tùy chọn tải lên một ảnh tham khảo, và để AI tạo ra một đoạn video ngắn độc đáo.';
      default: return '';
    }
  };

  return (
    <div className="text-center text-gray-400">
      <div className="text-5xl mb-4">✨</div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {getTitle()}
      </h3>
      <p>
        {getDescription()}
      </p>
    </div>
  );
};


const LoadingState: React.FC = () => {
    const [message, setMessage] = useState(LOADING_MESSAGES[0]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setMessage(prevMessage => {
                const currentIndex = LOADING_MESSAGES.indexOf(prevMessage);
                const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
                return LOADING_MESSAGES[nextIndex];
            });
        }, 2500);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="text-center">
            <div className="flex justify-center items-center mb-4">
                <SpinnerIcon />
            </div>
            <p className="text-lg font-semibold text-white animate-pulse">{message}</p>
        </div>
    );
}

const AnalyzedTextResult: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = () => {
    if (!navigator.clipboard) {
        alert("Clipboard API not available");
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSelectAndCopy = () => {
    textAreaRef.current?.select();
    handleCopy();
  }

  return (
    <div className="w-full max-w-2xl mx-auto text-left space-y-4">
        <h3 className="text-xl font-semibold text-white">Mô tả từ AI</h3>
        <div className="relative">
            <textarea
                ref={textAreaRef}
                readOnly
                value={text}
                className="w-full h-48 p-3 bg-gray-900 border border-gray-700 rounded-md shadow-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none"
                aria-label="Generated prompt"
            />
        </div>
        <div className="flex justify-end gap-3">
             <button
                onClick={handleSelectAndCopy}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900"
            >
                {copied ? 'Đã sao chép!' : 'Chọn & Sao chép'}
            </button>
        </div>
    </div>
  );
};

const VideoResult: React.FC<{ videoUrl: string }> = ({ videoUrl }) => {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = `ai_studio_video_${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full max-w-2xl mx-auto text-center space-y-4">
            <video src={videoUrl} controls autoPlay loop className="w-full rounded-lg shadow-lg" aria-label="Generated video result" />
            <button
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900"
            >
                <DownloadIcon />
                Tải video
            </button>
        </div>
    );
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ isLoading, results, mode, onCreateVideo }) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleDownload = (base64Image: string, index: number) => {
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${base64Image}`;
    link.download = `generated_image_${index + 1}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setZoomedImage(null);
    }
  }, []);

  useEffect(() => {
    if (zoomedImage) {
      window.addEventListener('keydown', handleKeyDown);
    } else {
      window.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoomedImage, handleKeyDown]);

  const hasResults = results.length > 0;
  const numCols = results.length > 1 ? 'grid-cols-2' : 'grid-cols-1';
  const itemSpan = results.length === 1 ? 'max-w-md mx-auto' : '';
  const showCreateVideoAction = mode === 'generate' || mode === 'edit';

  return (
    <>
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 min-h-[60vh] flex items-center justify-center border-2 border-dashed border-gray-700">
        {isLoading && <LoadingState />}
        {!isLoading && !hasResults && <WelcomeState mode={mode} />}
        {!isLoading && hasResults && (
            mode === 'analyze' && results[0] ? (
                <AnalyzedTextResult text={results[0]} />
            ) : mode === 'video' && results[0] ? (
                <VideoResult videoUrl={results[0]} />
            ) : (
                <div className={`grid ${numCols} gap-4 w-full`}>
                    {results.map((base64, index) => (
                    <div key={index} className={`relative group overflow-hidden rounded-lg shadow-lg ${itemSpan} cursor-pointer`} onClick={() => setZoomedImage(base64)}>
                        <img
                        src={`data:image/jpeg;base64,${base64}`}
                        alt={`Generated result ${index + 1}`}
                        className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); setZoomedImage(base64); }}
                            className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
                            aria-label="Zoom image"
                        >
                            <ZoomIcon />
                        </button>
                        {showCreateVideoAction && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onCreateVideo(base64, 'image/jpeg'); }}
                                className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
                                aria-label="Create video from image"
                                title="Tạo video từ ảnh này"
                            >
                                <CreateVideoIcon />
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(base64, index); }}
                            className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
                            aria-label="Download image"
                        >
                            <DownloadIcon />
                        </button>
                        </div>
                    </div>
                    ))}
                </div>
            )
        )}
      </div>
      {zoomedImage && (
        <ImageModal 
          imageUrl={`data:image/jpeg;base64,${zoomedImage}`}
          onClose={() => setZoomedImage(null)}
        />
      )}
    </>
  );
};