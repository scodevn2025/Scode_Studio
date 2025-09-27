import React, { useState, useCallback, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LightbulbIcon } from './components/icons/LightbulbIcon';
import * as geminiService from './services/geminiService';
import type { AppMode, OutputQuality, ImageData } from './types';
import { useOutputQuality } from './hooks/useOutputQuality';
import { Toast } from './components/Toast';
import { ApiKeyModal } from './components/ApiKeyModal';
import { KeyIcon } from './components/icons/KeyIcon';


interface InitialVideoOptions {
    image: ImageData;
    prompt: string;
    suggestions: string[];
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('generate');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useOutputQuality();
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const [initialVideoOptions, setInitialVideoOptions] = useState<InitialVideoOptions | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const API_KEY_STORAGE_KEY = 'ai-studio-gemini-api-key';
  const DEFAULT_API_KEY = 'AIzaSyDAx4_ghqjewp4pk3OanVlsliIE7fpTaKQ';
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE_KEY) || DEFAULT_API_KEY);

  useEffect(() => {
    if (rateLimitCooldown > 0) {
      const timerId = setTimeout(() => {
        setRateLimitCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    }
  }, [rateLimitCooldown]);

  const handleApiKeySave = (newKey: string) => {
    const trimmedKey = newKey.trim();
    setApiKey(trimmedKey);
    localStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey);
    setIsApiKeyModalOpen(false); // Close modal on save
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    setResults([]);
    setError(null);
    setInitialVideoOptions(null);
  };

  const clearInitialVideoOptions = useCallback(() => {
    setInitialVideoOptions(null);
  }, []);

  const handleCreateVideoFromImage = useCallback(async (base64: string, mimeType: string) => {
    if (!apiKey) {
      setError("Vui lòng nhập Gemini API Key của bạn để tạo video.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults([]); // Clear previous results display
    try {
        const image = { base64, mimeType };
        const suggestions = await geminiService.generateVideoIdeasFromImage({ image }, apiKey);

        if (!suggestions || suggestions.length === 0) {
            throw new Error("Không thể tạo gợi ý video cho ảnh này.");
        }
        
        setInitialVideoOptions({ image, prompt: suggestions[0], suggestions });
        setMode('video'); // Switch mode after successful analysis
    } catch (e: any) {
        setError(e.message || "Không thể phân tích ảnh để tạo prompt video.");
    } finally {
        setIsLoading(false);
    }
  }, [apiKey]);
  
  const handleSubmit = useCallback(async (options: any) => {
    if (!apiKey) {
        setError("Vui lòng nhập Gemini API Key của bạn để tiếp tục.");
        setIsApiKeyModalOpen(true);
        return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
        let response: string[] | string;
        const optionsWithQuality = { ...options, quality };

        switch (mode) {
            case 'generate':
                response = await geminiService.generateImage(optionsWithQuality, apiKey);
                break;
            case 'edit':
                response = await geminiService.editImage(optionsWithQuality, apiKey);
                break;
            case 'swap':
                response = await geminiService.swapFaces(optionsWithQuality, apiKey);
                break;
            case 'magic':
                response = await geminiService.magicAction(optionsWithQuality, apiKey);
                break;
            case 'analyze':
                response = await geminiService.analyzeImage(optionsWithQuality, apiKey);
                break;
            case 'video':
                response = await geminiService.generateVideo(optionsWithQuality, apiKey);
                break;
            default:
                throw new Error('Chế độ không hợp lệ');
        }
        
        setResults(Array.isArray(response) ? response : [response]);

    } catch (e: any) {
        const errorMessage = e.message || 'Đã xảy ra lỗi không xác định.';
        setError(errorMessage); // Always show the specific error message from the service
        
        if (errorMessage.includes('Khóa API mặc định đã hết hạn ngạch')) {
            setIsApiKeyModalOpen(true);
        } else if (errorMessage.includes('hạn ngạch sử dụng API')) { // Handle temporary rate limits
            setRateLimitCooldown(60);
        }
    } finally {
        setIsLoading(false);
    }
  }, [mode, quality, apiKey]);

  const MODES: { id: AppMode; name: string }[] = [
      { id: 'generate', name: 'Tạo ảnh' },
      { id: 'edit', name: 'Biến hoá' },
      { id: 'swap', name: 'Hoán đổi' },
      { id: 'magic', name: 'Magic Edit' },
      { id: 'analyze', name: 'Phân tích' },
      { id: 'video', name: 'Tạo video' },
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      {error && <Toast message={error} onClose={() => setError(null)} />}
      {isApiKeyModalOpen && (
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          apiKey={apiKey}
          onApiKeySave={handleApiKeySave}
        />
      )}
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8 relative">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            AI Image Studio
          </h1>
          <p className="text-gray-400 mt-2">
            Công cụ sáng tạo hình ảnh mạnh mẽ với Gemini AI
          </p>
          <div className="absolute top-0 right-0">
              <button
                  onClick={() => setIsApiKeyModalOpen(true)}
                  className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                  title="Quản lý API Key"
              >
                  <KeyIcon />
              </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-gray-800/50 rounded-lg border border-gray-700 shadow-2xl flex flex-col">
              <nav className="flex-shrink-0 flex items-center justify-between border-b border-gray-700 p-2">
                  <div className="flex flex-wrap">
                    {MODES.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleModeChange(m.id)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                          ${mode === m.id ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}
                        `}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
              </nav>
              <div className="flex-grow">
                <ControlPanel 
                  mode={mode} 
                  onSubmit={handleSubmit} 
                  isLoading={isLoading}
                  quality={quality}
                  onQualityChange={setQuality}
                  cooldown={rateLimitCooldown}
                  initialVideoOptions={initialVideoOptions}
                  onClearInitialVideoOptions={clearInitialVideoOptions}
                  apiKey={apiKey}
                />
              </div>
          </div>

          <div className="lg:col-span-2">
            <ResultsDisplay 
              isLoading={isLoading} 
              results={results}
              mode={mode}
              onCreateVideo={handleCreateVideoFromImage}
            />
          </div>
        </main>

         <footer className="text-center mt-12 text-gray-500 text-sm">
            <p>Powered by Google Gemini. Interface designed by a world-class senior frontend engineer.</p>
            <p className="mt-2">bản quyền thuộc về ScodeVN : 0394091919</p>
        </footer>
      </div>
    </div>
  );
};

export default App;