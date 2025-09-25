// FIX: Implemented the ControlPanel component with mode selection and forms for image generation, editing, and face swapping.
import React, { useState, useEffect } from 'react';
import { ImageUploader } from './ImageUploader';
import { useCharacterPresets } from '../hooks/useCharacterPresets';
import { useOutputQuality } from '../hooks/useOutputQuality';
import { analyzeImageAndGetPrompt } from '../services/geminiService';
import type { AppMode, GenerateOptions, EditOptions, SwapOptions, AspectRatio, ImageData, MagicAction, MagicOptions, OutputQuality } from '../types';
import { ASPECT_RATIOS, PREDEFINED_PROMPTS } from '../constants';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { SaveIcon } from './icons/SaveIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SparklesIcon } from './icons/SparklesIcon';


interface ControlPanelProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  onSubmit: (options: GenerateOptions | EditOptions | SwapOptions | MagicOptions) => void;
  isLoading: boolean;
}

const ModeSelector: React.FC<{ mode: AppMode; setMode: (mode: AppMode) => void; }> = ({ mode, setMode }) => {
  const modes: { id: AppMode, label: string }[] = [
    { id: 'edit', label: 'Ghép nhân vật' },
    { id: 'swap', label: 'Hoán đổi mặt' },
    { id: 'magic', label: 'Chỉnh sửa nhanh' },
    { id: 'generate', label: 'Tạo ảnh mới' },
  ];

  return (
    <div className="grid grid-cols-2 bg-gray-800 rounded-lg p-1 gap-1">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={`w-full px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
            ${mode === m.id
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-300 hover:bg-gray-700'
            }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
};

const QualitySelector: React.FC<{ quality: OutputQuality; setQuality: (quality: OutputQuality) => void; }> = ({ quality, setQuality }) => {
  const qualities: { id: OutputQuality, label: string }[] = [
    { id: 'standard', label: 'Tiêu chuẩn' },
    { id: 'high', label: 'Chất lượng cao' },
    { id: 'maximum', label: 'Tối đa' },
  ];
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Chất lượng ảnh xuất</label>
      <div className="grid grid-cols-3 bg-gray-900 rounded-lg p-1 gap-1">
        {qualities.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setQuality(q.id)}
            className={`w-full px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
              quality === q.id
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const PromptSuggestions: React.FC<{ mode: AppMode; onSelect: (value: string) => void }> = ({ mode, onSelect }) => (
  <div className="flex flex-wrap gap-2 mt-2">
    {PREDEFINED_PROMPTS[mode].slice(0, 6).map((prompt, index) => (
      <button
        key={index}
        type="button"
        onClick={() => onSelect(prompt.value)}
        className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded-full hover:bg-gray-600 transition-colors"
      >
        {prompt.name}
      </button>
    ))}
  </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({ mode, setMode, onSubmit, isLoading }) => {
  // Common state
  const [prompt, setPrompt] = useState('');
  const [quality, setQuality] = useOutputQuality();

  // Generate state
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [numberOfImages, setNumberOfImages] = useState(4);

  // Edit state
  const [characterImages, setCharacterImages] = useState<ImageData[]>([]);
  const [productImage, setProductImage] = useState<ImageData[]>([]);
  const [numberOfVariations, setNumberOfVariations] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Swap state
  const [sourceFaceImage, setSourceFaceImage] = useState<ImageData[]>([]);
  const [targetImage, setTargetImage] = useState<ImageData[]>([]);

  // Magic Edit state
  const [magicAction, setMagicAction] = useState<MagicAction>('upscale');
  const [magicImage, setMagicImage] = useState<ImageData[]>([]);

  // Character presets for Edit mode
  const { presets, addPreset, removePreset } = useCharacterPresets();
  const [presetName, setPresetName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  
  useEffect(() => {
    // Reset inputs when mode changes
    setPrompt('');
    setCharacterImages([]);
    setProductImage([]);
    setSourceFaceImage([]);
    setTargetImage([]);
    setMagicImage([]);
    setSelectedPresetId('');
    setPresetName('');
    setNumberOfVariations(1);
  }, [mode]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPresetId(id);
    const selected = presets.find(p => p.id === id);
    if (selected) {
      setCharacterImages(selected.images);
      setPrompt(selected.prompt || '');
    } else {
      setCharacterImages([]);
      setPrompt('');
    }
  };

  const handleSavePreset = () => {
    if (presetName && characterImages.length > 0) {
      addPreset(presetName, characterImages, prompt);
      setPresetName('');
      alert(`Đã lưu preset '${presetName}'!`);
    } else {
      alert('Vui lòng nhập tên và tải lên ít nhất một ảnh nhân vật.');
    }
  };
  
  const handleAnalyzeImage = async () => {
    if (isLoading || isAnalyzing || !characterImages[0]) return;
    setIsAnalyzing(true);
    try {
      const newPrompt = await analyzeImageAndGetPrompt(characterImages[0]);
      if (newPrompt) {
        setPrompt(newPrompt);
      } else {
        alert("Không thể phân tích ảnh. AI không trả về mô tả.");
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Đã xảy ra lỗi khi phân tích ảnh.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (mode === 'generate') {
      onSubmit({ prompt, aspectRatio, numberOfImages, quality } as GenerateOptions);
    } else if (mode === 'edit') {
      if (characterImages.length === 0) {
        alert('Vui lòng tải lên ít nhất một ảnh nhân vật.');
        return;
      }
      onSubmit({ prompt, characterImages, productImage: productImage[0], numberOfVariations, quality } as EditOptions);
    } else if (mode === 'swap') {
      if (!sourceFaceImage[0] || !targetImage[0]) {
        alert('Vui lòng tải lên ảnh khuôn mặt nguồn và ảnh đích.');
        return;
      }
      onSubmit({ prompt, sourceFaceImage: sourceFaceImage[0], targetImage: targetImage[0], numberOfVariations, quality } as SwapOptions);
    } else if (mode === 'magic') {
        if (!magicImage[0]) {
            alert('Vui lòng tải lên ảnh để chỉnh sửa.');
            return;
        }
        if ((magicAction === 'remove-object' || magicAction === 'change-background') && !prompt.trim()) {
            alert('Vui lòng nhập mô tả cho thao tác này.');
            return;
        }
        onSubmit({ action: magicAction, image: magicImage[0], prompt, quality } as MagicOptions);
    }
  };

  const isSubmitDisabled = isLoading || (mode === 'edit' && characterImages.length === 0) || (mode === 'swap' && (sourceFaceImage.length === 0 || targetImage.length === 0)) || (mode === 'magic' && magicImage.length === 0);
  
  const actionsRequiringPrompt: MagicAction[] = ['remove-object', 'change-background'];
  const hasPrompt = mode !== 'magic' || actionsRequiringPrompt.includes(magicAction);

  const getPromptLabel = () => {
    if (mode === 'magic') {
        if (magicAction === 'remove-object') return 'Mô tả vật thể cần xóa';
        if (magicAction === 'change-background') return 'Mô tả nền mới';
    }
    return 'Yêu cầu của bạn';
  };

  const getPromptPlaceholder = () => {
     if (mode === 'generate') return 'Mô tả nhân vật và bối cảnh bạn muốn tạo...';
     if (mode === 'edit') return 'Nhân vật đang làm gì, ở đâu, trang phục...';
     if (mode === 'swap') return 'Mô tả thêm cho việc hoán đổi, ví dụ: "cười tươi", "nhìn thẳng"...';
     if (mode === 'magic') {
        if (magicAction === 'remove-object') return 'Ví dụ: "chiếc ô màu đỏ", "người đàn ông ở phía sau"';
        if (magicAction === 'change-background') return 'Ví dụ: "một bãi biển nhiệt đới vào lúc hoàng hôn", "phố đêm Tokyo với đèn neon"';
     }
     return '';
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 sm:p-6 space-y-6">
      <ModeSelector mode={mode} setMode={setMode} />
      <QualitySelector quality={quality} setQuality={setQuality} />
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {mode === 'edit' && (
          <>
            <ImageUploader
              label="1. Tải ảnh nhân vật (có thể tải nhiều)"
              onUpload={setCharacterImages}
              uploadedImages={characterImages}
              multiple
            />
            {characterImages.length > 0 && (
              <button
                type="button"
                onClick={handleAnalyzeImage}
                disabled={isLoading || isAnalyzing}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-indigo-500/50 text-indigo-300 rounded-md shadow-sm text-sm font-medium hover:bg-indigo-500/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:bg-gray-700/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? <SpinnerIcon /> : <SparklesIcon />}
                <span>{isAnalyzing ? 'Đang phân tích...' : 'Phân tích ảnh & Lấy gợi ý'}</span>
              </button>
            )}
             <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg">
                <label className="block text-sm font-medium text-gray-300">2. Quản lý nhân vật (tùy chọn)</label>
                <div className="flex gap-2">
                    <select value={selectedPresetId} onChange={handlePresetChange} className="flex-grow bg-gray-800 border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">-- Chọn nhân vật có sẵn --</option>
                        {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {selectedPresetId && <button type="button" onClick={() => removePreset(selectedPresetId)} className="p-2 bg-red-600/50 hover:bg-red-600 rounded-md text-white"><TrashIcon /></button>}
                </div>
                 <div className="flex gap-2">
                    <input type="text" value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Tên nhân vật mới..." className="flex-grow bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    <button type="button" onClick={handleSavePreset} className="p-2 bg-indigo-600/50 hover:bg-indigo-600 rounded-md text-white" disabled={!presetName || characterImages.length === 0}><SaveIcon /></button>
                 </div>
             </div>
            <ImageUploader
              label="3. Tải ảnh sản phẩm (tùy chọn)"
              onUpload={setProductImage}
              uploadedImages={productImage}
            />
          </>
        )}
        
        {hasPrompt && (
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">
              {getPromptLabel()}
            </label>
            <textarea
              id="prompt"
              rows={mode === 'magic' ? 2 : 4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-1 block w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={getPromptPlaceholder()}
              required={mode !== 'magic'}
            />
            {mode !== 'magic' && <PromptSuggestions mode={mode} onSelect={(value) => setPrompt(current => `${current} ${value}`.trim())} />}
          </div>
        )}

        {mode === 'generate' && (
          <div>
            <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300">
              Tỷ lệ khung hình
            </label>
            <select
              id="aspectRatio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="mt-1 block w-full bg-gray-900 border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {ASPECT_RATIOS.map(ratio => <option key={ratio} value={ratio}>{ratio}</option>)}
            </select>
          </div>
        )}

        {mode === 'swap' && (
          <>
            <ImageUploader
              label="1. Ảnh khuôn mặt nguồn"
              onUpload={setSourceFaceImage}
              uploadedImages={sourceFaceImage}
            />
            <ImageUploader
              label="2. Ảnh đích (để ghép mặt vào)"
              onUpload={setTargetImage}
              uploadedImages={targetImage}
            />
          </>
        )}

        {mode === 'magic' && (
          <div className="space-y-4">
            <ImageUploader
              label="1. Tải ảnh cần chỉnh sửa"
              onUpload={setMagicImage}
              uploadedImages={magicImage}
            />
            <div>
               <label className="block text-sm font-medium text-gray-300 mb-2">2. Chọn thao tác</label>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button type="button" onClick={() => setMagicAction('upscale')} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${magicAction === 'upscale' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Nâng cấp</button>
                  <button type="button" onClick={() => setMagicAction('remove-background')} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${magicAction === 'remove-background' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Xoá nền</button>
                  <button type="button" onClick={() => setMagicAction('color-correct')} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${magicAction === 'color-correct' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Sửa màu</button>
                  <button type="button" onClick={() => setMagicAction('beautify-portrait')} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${magicAction === 'beautify-portrait' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Làm đẹp</button>
                  <button type="button" onClick={() => setMagicAction('remove-object')} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${magicAction === 'remove-object' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Xóa vật thể</button>
                  <button type="button" onClick={() => setMagicAction('change-background')} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${magicAction === 'change-background' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Đổi nền</button>
               </div>
            </div>
          </div>
        )}

        {(mode === 'edit' || mode === 'swap') && (
            <div>
              <label htmlFor="variations" className="block text-sm font-medium text-gray-300">
                Số phiên bản ({numberOfVariations})
              </label>
              <input
                id="variations"
                type="range"
                min="1"
                max="4"
                value={numberOfVariations}
                onChange={(e) => setNumberOfVariations(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
        )}


        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <SpinnerIcon />
              Đang xử lý...
            </>
          ) : (
            'Tạo ảnh'
          )}
        </button>
      </form>
    </div>
  );
};