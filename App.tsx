import React, { useState, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ResultsDisplay } from './components/ResultsDisplay';
import {
  generateImages,
  editImage,
  swapFace,
  magicEditImage,
} from './services/geminiService';
import type {
  AppMode,
  GenerateOptions,
  EditOptions,
  SwapOptions,
  MagicOptions,
} from './types';

function App() {
  const [mode, setMode] = useState<AppMode>('edit');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (options: GenerateOptions | EditOptions | SwapOptions | MagicOptions) => {
      setIsLoading(true);
      setError(null);
      setResults([]);

      try {
        let imageResults: (string | null)[] = [];
        if (mode === 'generate') {
          imageResults = await generateImages(options as GenerateOptions);
        } else if (mode === 'edit') {
          const editOptions = options as EditOptions;
          const promises = [];
          // For each uploaded character image, create the requested number of variations.
          for (const characterImage of editOptions.characterImages) {
            for (let i = 0; i < editOptions.numberOfVariations; i++) {
              promises.push(
                editImage({
                  prompt: editOptions.prompt,
                  characterImage,
                  productImage: editOptions.productImage,
                  quality: editOptions.quality,
                })
              );
            }
          }
          imageResults = await Promise.all(promises);
        } else if (mode === 'swap') {
          const swapOptions = options as SwapOptions;
          const promises = [];
          for (let i = 0; i < swapOptions.numberOfVariations; i++) {
              promises.push(
                  swapFace({
                      prompt: swapOptions.prompt,
                      sourceFaceImage: swapOptions.sourceFaceImage,
                      targetImage: swapOptions.targetImage,
                      quality: swapOptions.quality,
                  })
              );
          }
          imageResults = await Promise.all(promises);
        } else if (mode === 'magic') {
          const magicOptions = options as MagicOptions;
          const result = await magicEditImage(magicOptions);
          imageResults = result ? [result] : [];
        }

        const validResults = imageResults.filter((res): res is string => res !== null);
        
        if (validResults.length > 0) {
            setResults(validResults);
        } else {
            setError("The AI couldn't generate a valid image for this request. Please try adjusting your prompt or images.");
        }

      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    },
    [mode]
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white font-sans">
      <header className="bg-gray-900/80 backdrop-blur-sm sticky w-full top-0 z-10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
              AI Image Suite
            </h1>
            <p className="text-sm text-gray-400">Tạo, chỉnh sửa và biến đổi hình ảnh với sức mạnh của AI</p>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-7xl mx-auto p-4 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 lg:sticky lg:top-28">
            <ControlPanel
              mode={mode}
              setMode={setMode}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>
          <div className="lg:col-span-3">
            <ResultsDisplay
              isLoading={isLoading}
              results={results}
              error={error}
              mode={mode}
            />
          </div>
        </div>
      </main>

      <footer className="w-full bg-gray-900/80 border-t border-gray-800 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-8 text-center text-sm text-gray-500">
          <p>Author: ScodeVN | Hotline: 0394091919</p>
        </div>
      </footer>
    </div>
  );
}

export default App;