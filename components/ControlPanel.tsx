import React, { useState, useMemo, useEffect } from 'react';
import type { AppMode, GenerateOptions, EditOptions, SwapOptions, MagicOptions, AnalyzeOptions, AspectRatio, MagicAction, ImageData, OutputQuality, VideoOptions } from '../types';
import { ASPECT_RATIOS, MAGIC_ACTIONS, PROMPT_SUGGESTION_TAGS, OUTPUT_QUALITIES } from '../constants';
import { ImageUploader, MultiImageUploader } from './ImageUploader';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import * as geminiService from '../services/geminiService';
import { LightbulbIcon } from './icons/LightbulbIcon';


interface InitialVideoOptions {
    image: ImageData;
    prompt: string;
    suggestions: string[];
}
interface ControlPanelProps {
  mode: AppMode;
  onSubmit: (options: any) => void;
  isLoading: boolean;
  quality: OutputQuality;
  onQualityChange: (quality: OutputQuality) => void;
  cooldown: number;
  initialVideoOptions?: InitialVideoOptions | null;
  onClearInitialVideoOptions?: () => void;
  apiKey: string;
}

const QualitySelector: React.FC<{ quality: OutputQuality, onQualityChange: (q: OutputQuality) => void }> = ({ quality, onQualityChange }) => (
    <div>
        <label htmlFor="quality-selector" className="block text-sm font-medium text-gray-300 mb-2">Chất lượng đầu ra</label>
        <select 
            id="quality-selector" 
            value={quality} 
            onChange={e => onQualityChange(e.target.value as OutputQuality)}
            className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white p-2"
        >
            {OUTPUT_QUALITIES.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
        </select>
        <div className="flex items-start text-xs text-gray-500 mt-2 p-2 bg-gray-900/50 rounded-md">
            <LightbulbIcon />
            <span className="ml-2">Chất lượng cao hơn có thể mất nhiều thời gian và chi phí hơn. Hiện tại, cài đặt này mang tính tham khảo.</span>
        </div>
    </div>
);


const PromptSuggestions: React.FC<{prompt: string, images?: ImageData[], onSelect: (suggestion: string) => void, initialSuggestions?: string[], apiKey: string}> = ({ prompt, images, onSelect, initialSuggestions, apiKey }) => {
    const [suggestions, setSuggestions] = useState<string[]>(initialSuggestions || []);
    const [isSuggesting, setIsSuggesting] = useState(false);
    
    useEffect(() => {
        if (initialSuggestions) {
            setSuggestions(initialSuggestions);
        }
    }, [initialSuggestions]);

    const handleSuggest = async () => {
        if (!prompt.trim() && (!images || images.length === 0)) {
            alert("Vui lòng nhập ý tưởng ban đầu hoặc tải ảnh lên để nhận gợi ý.");
            return;
        }
        setIsSuggesting(true);
        setSuggestions([]); 
        try {
            const result = await geminiService.generatePromptSuggestions({ prompt, images }, apiKey);
            setSuggestions(result);
        } catch (error) {
            console.error(error);
            alert("Không thể tạo gợi ý. Vui lòng thử lại.");
        } finally {
            setIsSuggesting(false);
        }
    };

    return (
        <>
            {suggestions.length > 0 && (
                <div className="mt-4 space-y-2">
                    <p className="text-xs text-gray-400">Gợi ý từ AI (nhấn để sử dụng):</p>
                    {suggestions.map((s, i) => (
                         <div key={i} onClick={() => onSelect(s)} className="p-2 bg-gray-700/50 rounded-md text-sm text-gray-300 cursor-pointer hover:bg-gray-700 transition-all duration-200">
                            {s}
                        </div>
                    ))}
                </div>
            )}
            <button 
                type="button" 
                onClick={handleSuggest}
                disabled={isSuggesting || !apiKey}
                className="mt-2 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                title={!apiKey ? "Vui lòng nhập API Key để sử dụng tính năng này" : ""}
            >
                {isSuggesting ? <SpinnerIcon /> : <SparklesIcon />}
                <span className="ml-2">{isSuggesting ? "Đang lấy gợi ý..." : (suggestions.length > 0 ? "Tạo gợi ý khác" : "Gợi ý Prompt")}</span>
            </button>
        </>
    );
};

const PromptAssistant: React.FC<{ onTagClick: (tag: string) => void }> = ({ onTagClick }) => {
    return (
        <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1">Thêm chi tiết:</p>
            {Object.entries(PROMPT_SUGGESTION_TAGS).map(([category, tags]) => (
                <div key={category} className="mb-2">
                    <p className="text-xs font-semibold text-gray-300">{category}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {tags.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => onTagClick(tag)}
                                className="px-2 py-0.5 bg-gray-700 text-xs text-gray-300 rounded-full hover:bg-gray-600 transition-colors"
                            >
                                + {tag}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const VideoForm: React.FC<Omit<ControlPanelProps, 'mode'>> = ({ onSubmit, isLoading, cooldown, initialVideoOptions, onClearInitialVideoOptions, apiKey, quality, onQualityChange }) => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [image, setImage] = useState<ImageData | null>(null);
    const [initialSuggestions, setInitialSuggestions] = useState<string[] | undefined>();

    useEffect(() => {
        if (initialVideoOptions && onClearInitialVideoOptions) {
            setImage(initialVideoOptions.image);
            setPrompt(initialVideoOptions.prompt);
            setInitialSuggestions(initialVideoOptions.suggestions);
            onClearInitialVideoOptions(); // Consume the initial data
        }
    }, [initialVideoOptions, onClearInitialVideoOptions]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            alert("Vui lòng nhập mô tả.");
            return;
        }
        const options: VideoOptions = { prompt, aspectRatio, image: image || undefined };
        onSubmit(options);
    };

    const handleTagClick = (tag: string) => {
        setPrompt(p => p ? `${p}, ${tag}` : tag);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="prompt-video" className="block text-sm font-medium text-gray-300 mb-2">Mô tả video (Prompt)</label>
                <textarea
                    id="prompt-video"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={5}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white p-2"
                    placeholder="VD: một con mèo đội mũ cao bồi đang cưỡi ngựa trên sao Hỏa, phong cách điện ảnh"
                />
                <PromptAssistant onTagClick={handleTagClick} />
                <PromptSuggestions 
                    prompt={prompt} 
                    images={image ? [image] : undefined} 
                    onSelect={setPrompt} 
                    initialSuggestions={initialSuggestions} 
                    apiKey={apiKey}
                />
            </div>

            <ImageUploader label="Ảnh đầu vào (tùy chọn)" image={image} onImageChange={setImage} />
            
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tỷ lệ khung hình</label>
                <div className="grid grid-cols-5 gap-2">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button
                            type="button"
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            className={`p-2 border rounded-md text-xs transition-colors ${
                                aspectRatio === ratio ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                            }`}
                        >
                            {ratio}
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-xs text-gray-500 mt-1 px-1">Lưu ý: Quá trình tạo video có thể mất vài phút.</p>

            <QualitySelector quality={quality} onQualityChange={onQualityChange} />

            <button
                type="submit"
                disabled={isLoading || cooldown > 0 || !prompt.trim()}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:bg-indigo-400 disabled:cursor-not-allowed mt-4"
            >
                {isLoading && <SpinnerIcon />}
                {isLoading ? 'Đang tạo video...' : cooldown > 0 ? `Vui lòng đợi (${cooldown}s)` : 'Tạo video'}
            </button>
        </form>
    );
};


const GenerateForm: React.FC<Omit<ControlPanelProps, 'mode'>> = ({ onSubmit, isLoading, cooldown, apiKey, quality, onQualityChange }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [numberOfImages, setNumberOfImages] = useState(4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
        alert("Vui lòng nhập mô tả.");
        return;
    }
    const options: Omit<GenerateOptions, 'quality'> = { prompt, aspectRatio, numberOfImages };
    onSubmit(options);
  };

  const handleTagClick = (tag: string) => {
      setPrompt(p => p ? `${p}, ${tag}` : tag);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="prompt-generate" className="block text-sm font-medium text-gray-300 mb-2">Mô tả (Prompt)</label>
        <textarea
          id="prompt-generate"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white p-2"
          placeholder="VD: một chú mèo phi hành gia đang lướt ván trong vũ trụ, phong cách nghệ thuật số"
        />
        <PromptAssistant onTagClick={handleTagClick} />
        <PromptSuggestions prompt={prompt} onSelect={setPrompt} apiKey={apiKey} />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Tỷ lệ khung hình</label>
        <div className="grid grid-cols-5 gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              type="button"
              key={ratio}
              onClick={() => setAspectRatio(ratio)}
              className={`p-2 border rounded-md text-xs transition-colors ${
                aspectRatio === ratio ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>

       <div>
          <label htmlFor="numberOfImages" className="block text-sm font-medium text-gray-300 mb-2">Số lượng ảnh: {numberOfImages}</label>
          <input
            type="range"
            id="numberOfImages"
            min="1"
            max="4"
            value={numberOfImages}
            onChange={e => setNumberOfImages(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
       </div>
      
      <QualitySelector quality={quality} onQualityChange={onQualityChange} />

      <button
        type="submit"
        disabled={isLoading || cooldown > 0 || !prompt.trim()}
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:bg-indigo-400 disabled:cursor-not-allowed mt-4"
      >
        {isLoading && <SpinnerIcon />}
        {isLoading ? 'Đang tạo...' : cooldown > 0 ? `Vui lòng đợi (${cooldown}s)` : 'Tạo ảnh'}
      </button>
    </form>
  );
};

const EditForm: React.FC<Omit<ControlPanelProps, 'mode'>> = ({ onSubmit, isLoading, cooldown, apiKey, quality, onQualityChange }) => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [characterImages, setCharacterImages] = useState<ImageData[]>([]);
    const [productImage, setProductImage] = useState<ImageData | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<ImageData | null>(null);
    const [numberOfVariations, setNumberOfVariations] = useState(2);
    
    const allImages = useMemo(() => {
        const images = [...characterImages];
        if (productImage) images.push(productImage);
        if (backgroundImage) images.push(backgroundImage);
        return images;
    }, [characterImages, productImage, backgroundImage]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            alert("Vui lòng nhập mô tả.");
            return;
        }
        if (characterImages.length === 0) {
            alert("Vui lòng tải lên ít nhất một ảnh nhân vật.");
            return;
        }
        const options: Omit<EditOptions, 'quality'> = { prompt, aspectRatio, characterImages, productImage: productImage || undefined, backgroundImage: backgroundImage || undefined, numberOfVariations };
        onSubmit(options);
    };
    
    const handleTagClick = (tag: string) => {
        setPrompt(p => p ? `${p}, ${tag}` : tag);
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prompt-edit" className="block text-sm font-medium text-gray-300 mb-2">Mô tả yêu cầu</label>
            <textarea
              id="prompt-edit"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white p-2"
              placeholder="VD: đặt nhân vật đứng cạnh sản phẩm trên một bãi biển lúc hoàng hôn"
            />
            <PromptAssistant onTagClick={handleTagClick} />
            <PromptSuggestions prompt={prompt} images={allImages} onSelect={setPrompt} apiKey={apiKey} />
          </div>
          
          <MultiImageUploader label="Ảnh nhân vật (tối đa 4)" images={characterImages} onImagesChange={setCharacterImages} limit={4} />
          <div className="grid grid-cols-2 gap-4">
            <ImageUploader label="Ảnh sản phẩm" image={productImage} onImageChange={setProductImage} />
            <ImageUploader label="Ảnh nền" image={backgroundImage} onImageChange={setBackgroundImage} />
          </div>

           <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tỷ lệ khung hình</label>
              <div className="grid grid-cols-5 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button type="button" key={ratio} onClick={() => setAspectRatio(ratio)} className={`p-2 border rounded-md text-xs transition-colors ${aspectRatio === ratio ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                    {ratio}
                  </button>
                ))}
              </div>
          </div>
          
           <div>
              <label htmlFor="numberOfVariations" className="block text-sm font-medium text-gray-300 mb-2">Số phiên bản: {numberOfVariations}</label>
              <input type="range" id="numberOfVariations" min="1" max="4" value={numberOfVariations} onChange={e => setNumberOfVariations(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
              {numberOfVariations > 1 && <p className="text-xs text-gray-500 mt-1 px-1">Lưu ý: Mỗi phiên bản mất khoảng 30 giây để tạo do giới hạn API.</p>}
           </div>

          <QualitySelector quality={quality} onQualityChange={onQualityChange} />

          <button type="submit" disabled={isLoading || cooldown > 0 || !prompt.trim() || characterImages.length === 0} className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:bg-indigo-400 disabled:cursor-not-allowed mt-4">
            {isLoading && <SpinnerIcon />}
            {isLoading ? 'Đang xử lý...' : cooldown > 0 ? `Vui lòng đợi (${cooldown}s)` : 'Thực hiện'}
          </button>
      </form>
    );
};

const SwapForm: React.FC<Omit<ControlPanelProps, 'mode'>> = ({ onSubmit, isLoading, cooldown, quality, onQualityChange }) => {
    const [prompt, setPrompt] = useState('');
    const [sourceFaceImage, setSourceFaceImage] = useState<ImageData | null>(null);
    const [targetImage, setTargetImage] = useState<ImageData | null>(null);
    const [numberOfVariations, setNumberOfVariations] = useState(1);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sourceFaceImage || !targetImage) {
            alert("Vui lòng tải lên cả ảnh khuôn mặt gốc và ảnh đích.");
            return;
        }
        const options: Omit<SwapOptions, 'quality'> = { prompt, sourceFaceImage, targetImage, numberOfVariations };
        onSubmit(options);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
                <ImageUploader label="Ảnh khuôn mặt gốc" image={sourceFaceImage} onImageChange={setSourceFaceImage} />
                <p className="text-xs text-gray-500 mt-1 px-1">Tải lên ảnh chân dung rõ mặt để có kết quả tốt nhất.</p>
            </div>
            <div>
                <ImageUploader label="Ảnh đích" image={targetImage} onImageChange={setTargetImage} />
                <p className="text-xs text-gray-500 mt-1 px-1">Ảnh mà bạn muốn ghép khuôn mặt vào.</p>
            </div>
          </div>
          <div>
            <label htmlFor="prompt-swap" className="block text-sm font-medium text-gray-300 mb-2">Yêu cầu thêm (tùy chọn)</label>
            <textarea
              id="prompt-swap"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white p-2"
              placeholder="VD: thay đổi màu tóc thành màu xanh"
            />
          </div>
           <div>
              <label htmlFor="numVariationsSwap" className="block text-sm font-medium text-gray-300 mb-2">Số phiên bản: {numberOfVariations}</label>
              <input type="range" id="numVariationsSwap" min="1" max="4" value={numberOfVariations} onChange={e => setNumberOfVariations(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
              {numberOfVariations > 1 && <p className="text-xs text-gray-500 mt-1 px-1">Lưu ý: Mỗi phiên bản mất khoảng 30 giây để tạo do giới hạn API.</p>}
           </div>

            <QualitySelector quality={quality} onQualityChange={onQualityChange} />

          <button type="submit" disabled={isLoading || cooldown > 0 || !sourceFaceImage || !targetImage} className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:bg-indigo-400 disabled:cursor-not-allowed mt-4">
            {isLoading && <SpinnerIcon />}
            {isLoading ? 'Đang hoán đổi...' : cooldown > 0 ? `Vui lòng đợi (${cooldown}s)` : 'Hoán đổi khuôn mặt'}
          </button>
      </form>
    );
};

const MagicForm: React.FC<Omit<ControlPanelProps, 'mode'>> = ({ onSubmit, isLoading, cooldown, quality, onQualityChange }) => {
    const [action, setAction] = useState<MagicAction>('upscale');
    const [image, setImage] = useState<ImageData | null>(null);
    const [prompt, setPrompt] = useState('');
    
    const needsPrompt = action === 'remove-object' || action === 'change-background';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!image) {
            alert("Vui lòng tải lên ảnh để chỉnh sửa.");
            return;
        }
        if (needsPrompt && !prompt.trim()) {
            alert("Vui lòng nhập mô tả cho hành động này.");
            return;
        }
        const options: Omit<MagicOptions, 'quality'> = { action, image, prompt: needsPrompt ? prompt : undefined };
        onSubmit(options);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <ImageUploader label="Tải ảnh cần chỉnh sửa" image={image} onImageChange={setImage} />
            
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hành động</label>
                <div className="grid grid-cols-2 gap-2">
                  {MAGIC_ACTIONS.map((act) => (
                    <button type="button" key={act.id} onClick={() => setAction(act.id)} className={`p-2 border rounded-md text-xs transition-colors text-center ${action === act.id ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                      {act.name}
                    </button>
                  ))}
                </div>
            </div>

            {needsPrompt && (
                 <div>
                    <label htmlFor="prompt-magic" className="block text-sm font-medium text-gray-300 mb-2">
                        {action === 'remove-object' ? 'Mô tả vật thể cần xóa' : 'Mô tả nền mới'}
                    </label>
                    <textarea
                      id="prompt-magic"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={2}
                      className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white p-2"
                      placeholder={action === 'remove-object' ? 'VD: chiếc ô màu đỏ' : 'VD: một khu rừng huyền ảo'}
                    />
                  </div>
            )}

            <QualitySelector quality={quality} onQualityChange={onQualityChange} />

            <button type="submit" disabled={isLoading || cooldown > 0 || !image || (needsPrompt && !prompt.trim())} className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:bg-indigo-400 disabled:cursor-not-allowed mt-4">
              {isLoading && <SpinnerIcon />}
              {isLoading ? 'Đang xử lý...' : cooldown > 0 ? `Vui lòng đợi (${cooldown}s)` : 'Áp dụng Magic'}
            </button>
        </form>
    );
};


const AnalyzeForm: React.FC<Omit<ControlPanelProps, 'mode' | 'quality' | 'onQualityChange'>> = ({ onSubmit, isLoading, cooldown }) => {
    const [image, setImage] = useState<ImageData | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!image) {
            alert("Vui lòng tải lên ảnh để phân tích.");
            return;
        }
        const options: Omit<AnalyzeOptions, 'quality'> = { image };
        onSubmit(options);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <ImageUploader label="Tải ảnh cần phân tích" image={image} onImageChange={setImage} />
            <button type="submit" disabled={isLoading || cooldown > 0 || !image} className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:bg-indigo-400 disabled:cursor-not-allowed">
              {isLoading && <SpinnerIcon />}
              {isLoading ? 'Đang phân tích...' : cooldown > 0 ? `Vui lòng đợi (${cooldown}s)` : 'Phân tích ảnh'}
            </button>
        </form>
    );
};

export const ControlPanel: React.FC<ControlPanelProps> = (props) => {
    const { mode } = props;
    
    const FormComponent = useMemo(() => {
        switch (mode) {
            case 'generate': return GenerateForm;
            case 'edit': return EditForm;
            case 'swap': return SwapForm;
            case 'magic': return MagicForm;
            case 'analyze': return AnalyzeForm;
            case 'video': return VideoForm;
            default: return () => null;
        }
    }, [mode]);

    return (
        <div className="p-4 sm:p-6">
            <FormComponent key={mode} {...props} />
        </div>
    );
};