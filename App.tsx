import React, { useState, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LightbulbIcon } from './components/icons/LightbulbIcon';
import * as geminiService from './services/geminiService';
import type { AppMode, OutputQuality } from './types';
import { useOutputQuality } from './hooks/useOutputQuality';
import { OUTPUT_QUALITIES } from './constants';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('generate');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useOutputQuality();

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    setResults([]);
    setError(null);
  };
  
  const handleSubmit = useCallback(async (options: any) => {
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
        let response: string[] | string;
        const optionsWithQuality = { ...options, quality };

        switch (mode) {
            case 'generate':
                response = await geminiService.generateImage(optionsWithQuality);
                break;
            case 'edit':
                response = await geminiService.editImage(optionsWithQuality);
                break;
            case 'swap':
                response = await geminiService.swapFaces(optionsWithQuality);
                break;
            case 'magic':
                response = await geminiService.magicAction(optionsWithQuality);
                break;
            case 'analyze':
                response = await geminiService.analyzeImage(optionsWithQuality);
                break;
            default:
                throw new Error('Chế độ không hợp lệ');
        }
        
        setResults(Array.isArray(response) ? response : [response]);

    } catch (e: any) {
        setError(e.message || 'Đã xảy ra lỗi không xác định.');
    } finally {
        setIsLoading(false);
    }
  }, [mode, quality]);

  const MODES: { id: AppMode; name: string }[] = [
      { id: 'generate', name: 'Tạo ảnh' },
      { id: 'edit', name: 'Biến hoá' },
      { id: 'swap', name: 'Hoán đổi' },
      { id: 'magic', name: 'Magic Edit' },
      { id: 'analyze', name: 'Phân tích' }
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            AI Image Studio
          </h1>
          <p className="text-gray-400 mt-2">
            Công cụ sáng tạo hình ảnh mạnh mẽ với Gemini AI
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-gray-800/50 rounded-lg border border-gray-700 shadow-2xl">
              <nav className="flex items-center justify-between border-b border-gray-700 p-2">
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
              <ControlPanel 
                mode={mode} 
                onSubmit={handleSubmit} 
                isLoading={isLoading}
                quality={quality}
              />
               <div className="p-4 border-t border-gray-700">
                <label htmlFor="quality-selector" className="block text-sm font-medium text-gray-300 mb-2">Chất lượng đầu ra</label>
                <select 
                  id="quality-selector" 
                  value={quality} 
                  onChange={e => setQuality(e.target.value as OutputQuality)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white p-2"
                >
                  {OUTPUT_QUALITIES.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                </select>
                <div className="flex items-start text-xs text-gray-500 mt-2 p-2 bg-gray-900/50 rounded-md">
                  <LightbulbIcon />
                  <span className="ml-2">Chất lượng cao hơn có thể mất nhiều thời gian và chi phí hơn. Hiện tại, cài đặt này mang tính tham khảo.</span>
                </div>
              </div>
          </div>

          <div className="lg:col-span-2">
            <ResultsDisplay 
              isLoading={isLoading} 
              results={results}
              error={error}
              mode={mode}
            />
          </div>
        </main>

         <footer className="text-center mt-12 text-gray-500 text-sm">
            <p>Powered by Google Gemini. Interface designed by a world-class senior frontend engineer.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
