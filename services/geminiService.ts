import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { GenerateOptions, EditOptions, SwapOptions, MagicOptions, AnalyzeOptions, ImageData, SuggestionOptions } from '../types';

// FIX: Initialize the GoogleGenAI client according to guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (imageData: ImageData) => {
    return {
        inlineData: {
            data: imageData.base64,
            mimeType: imageData.mimeType,
        },
    };
};

export const generateImage = async (options: GenerateOptions): Promise<string[]> => {
    try {
        // FIX: Use the 'imagen-4.0-generate-001' model for image generation
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: options.prompt,
            config: {
                numberOfImages: options.numberOfImages,
                aspectRatio: options.aspectRatio,
                outputMimeType: 'image/jpeg',
            },
        });

        return response.generatedImages.map(img => img.image.imageBytes);
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Không thể tạo ảnh. Vui lòng thử lại.");
    }
};

export const editImage = async (options: EditOptions): Promise<string[]> => {
    try {
        const parts: any[] = [];
        
        options.characterImages.forEach(img => parts.push(fileToGenerativePart(img)));
        if (options.productImage) parts.push(fileToGenerativePart(options.productImage));
        if (options.backgroundImage) parts.push(fileToGenerativePart(options.backgroundImage));
        
        let fullPrompt = options.prompt;
        if(options.aspectRatio) {
            fullPrompt += `\n\nLưu ý quan trọng: Tỷ lệ khung hình của ảnh đầu ra phải là ${options.aspectRatio}.`
        }

        parts.push({ text: fullPrompt });
        
        // FIX: The API only returns one image at a time, so we call it multiple times for variations
        const imagePromises = Array(options.numberOfVariations).fill(null).map(async () => {
             // FIX: Use 'gemini-2.5-flash-image-preview' for image editing tasks
             const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            if (!imagePart || !imagePart.inlineData) {
                const textResponse = response.text;
                throw new Error(`API không trả về hình ảnh. Phản hồi văn bản: ${textResponse}`);
            }
            return imagePart.inlineData.data;
        });

        return Promise.all(imagePromises);

    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Không thể chỉnh sửa ảnh. Vui lòng thử lại.");
    }
};

export const swapFaces = async (options: SwapOptions): Promise<string[]> => {
     try {
        const parts = [
            fileToGenerativePart(options.sourceFaceImage),
            fileToGenerativePart(options.targetImage),
            { text: `Hoán đổi khuôn mặt từ hình ảnh đầu tiên vào người trong hình ảnh thứ hai. Duy trì phong cách, ánh sáng và bối cảnh của hình thứ hai. Yêu cầu thêm: ${options.prompt}` },
        ];
        
        const imagePromises = Array(options.numberOfVariations).fill(null).map(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });
            const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            if (!imagePart || !imagePart.inlineData) {
                throw new Error("API không trả về hình ảnh.");
            }
            return imagePart.inlineData.data;
        });
        
        return Promise.all(imagePromises);

    } catch (error) {
        console.error("Error swapping faces:", error);
        throw new Error("Không thể hoán đổi khuôn mặt. Vui lòng thử lại.");
    }
};


export const magicAction = async (options: MagicOptions): Promise<string[]> => {
    let prompt = '';
    switch(options.action) {
        case 'upscale':
            prompt = 'Nâng cấp hình ảnh này lên độ phân giải cao hơn, cải thiện chi tiết và độ rõ nét mà không làm thay đổi nội dung. Làm cho nó trông sắc nét và chất lượng cao.';
            break;
        case 'remove-background':
            prompt = 'Xóa nền khỏi hình ảnh này, chỉ để lại chủ thể chính với nền trong suốt.';
            break;
        case 'color-correct':
            prompt = 'Tự động chỉnh màu trong ảnh này. Điều chỉnh độ sáng, độ tương phản và độ bão hòa để ảnh trông tự nhiên và sống động hơn.';
            break;
        case 'remove-object':
            prompt = `Xóa vật thể được mô tả trong câu lệnh này khỏi hình ảnh và lấp đầy nền một cách hợp lý: "${options.prompt}"`;
            break;
        case 'change-background':
             prompt = `Thay đổi nền của hình ảnh này thành: "${options.prompt}"`;
            break;
        case 'beautify-portrait':
            prompt = 'Làm đẹp cho ảnh chân dung này. Làm mịn da, làm sáng mắt và tinh chỉnh các đường nét trên khuôn mặt một cách tinh tế mà vẫn giữ được vẻ tự nhiên.';
            break;
        default:
            throw new Error('Hành động không được hỗ trợ.');
    }

    try {
        const parts = [
            fileToGenerativePart(options.image),
            { text: prompt },
        ];
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (!imagePart || !imagePart.inlineData) {
            throw new Error("API không trả về hình ảnh.");
        }
        return [imagePart.inlineData.data];

    } catch (error) {
        console.error("Error with magic action:", error);
        throw new Error("Không thể thực hiện hành động. Vui lòng thử lại.");
    }
};

export const analyzeImage = async (options: AnalyzeOptions): Promise<string> => {
    try {
        const parts = [
            fileToGenerativePart(options.image),
            { text: 'Hãy mô tả chi tiết hình ảnh này. Tạo một prompt mô tả có thể được sử dụng để tạo ra một hình ảnh tương tự bằng trình tạo ảnh AI. Tập trung vào chủ thể, phong cách, bố cục, màu sắc và ánh sáng.' },
        ];

        // FIX: Use 'gemini-2.5-flash' model for text-based tasks like analysis
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
        });

        // FIX: Access the text output directly from the response object
        return response.text;
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw new Error("Không thể phân tích ảnh. Vui lòng thử lại.");
    }
};

export const generatePromptSuggestions = async (options: SuggestionOptions): Promise<string[]> => {
    try {
        const parts: any[] = [];
        
        if (options.images && options.images.length > 0) {
            parts.push({ text: "Dựa vào những hình ảnh (nhân vật, sản phẩm, bối cảnh) và ý tưởng ban đầu của người dùng, hãy tạo ra 3 gợi ý mô tả (prompt) chi tiết, sáng tạo bằng tiếng Việt để AI tạo ra một bức ảnh ghép hoàn hảo. Ý tưởng của người dùng là:" });
            options.images.forEach(img => parts.push(fileToGenerativePart(img)));
        } else {
             parts.push({ text: "Dựa trên ý tưởng ban đầu của người dùng, hãy phát triển thành 3 gợi ý mô tả (prompt) chi tiết và sáng tạo hơn bằng tiếng Việt. Ý tưởng của người dùng là:" });
        }
        
        parts.push({ text: options.prompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING
                            }
                        }
                    },
                    required: ['suggestions']
                }
            }
        });
        
        const jsonText = response.text;
        const result = JSON.parse(jsonText);
        return result.suggestions || [];
    } catch (error) {
        console.error("Error generating prompt suggestions:", error);
        throw new Error("Không thể tạo gợi ý. Vui lòng thử lại.");
    }
};
