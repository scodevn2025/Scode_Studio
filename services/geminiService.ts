import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { GenerateOptions, EditOptions, SwapOptions, MagicOptions, AnalyzeOptions, ImageData, SuggestionOptions, VideoOptions, OutputQuality } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (imageData: ImageData) => {
    return {
        inlineData: {
            data: imageData.base64,
            mimeType: imageData.mimeType,
        },
    };
};

// Helper to add a delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to provide more specific error messages to the user.
const handleGeminiError = (error: any, defaultMessage: string): never => {
    console.error("Gemini Service Error:", error);
    try {
        // The error from the API can sometimes be a stringified JSON in the message property.
        if (error.message && typeof error.message === 'string') {
            const errorObj = JSON.parse(error.message);
            if (errorObj.error?.status === 'RESOURCE_EXHAUSTED') {
                throw new Error('Bạn đã vượt quá hạn ngạch sử dụng API. Vui lòng đợi một lát rồi thử lại.');
            }
             // Provide a more specific error message if available
            if (errorObj.error?.message) {
                throw new Error(`Lỗi từ AI: ${errorObj.error.message}`);
            }
        }
    } catch (e) {
        // If parsing fails or it's another error, check if the error is an instance of Error
        if (e instanceof Error) {
            // rethrow the specific error we created or another parsed error
            throw e;
        }
    }
    // Fallback for any other type of error
    throw new Error(defaultMessage);
};


export const generateImage = async (options: GenerateOptions): Promise<string[]> => {
    try {
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
        handleGeminiError(error, "Không thể tạo ảnh. Vui lòng thử lại.");
    }
};

export const editImage = async (options: EditOptions): Promise<string[]> => {
    try {
        const parts: any[] = [];
        
        // Label the images for clarity for the model
        parts.push({ text: "CÁC YẾU TỐ ĐẦU VÀO:" });
        options.characterImages.forEach((img, i) => {
            parts.push({ text: `[HÌNH ẢNH NHÂN VẬT ${i + 1}]` });
            parts.push(fileToGenerativePart(img));
        });
        if (options.productImage) {
            parts.push({ text: "[HÌNH ẢNH SẢN PHẨM]" });
            parts.push(fileToGenerativePart(options.productImage));
        }
        if (options.backgroundImage) {
            parts.push({ text: "[HÌNH ẢNH NỀN]" });
            parts.push(fileToGenerativePart(options.backgroundImage));
        }
        
        // Create a more explicit, machine-like prompt with a new rule for scaling
        let instruction = `HÀNH ĐỘNG: TẠO ẢNH MỚI.\n\nQUY TẮC:\n- Sử dụng các đặc điểm chính của nhân vật từ [HÌNH ẢNH NHÂN VẬT].\n- TỶ LỆ QUAN TRỌNG: Đảm bảo nhân vật có tỷ lệ kích thước phù hợp và thực tế so với bối cảnh trong [HÌNH ẢNH NỀN]. Nhân vật không được trông quá lớn hoặc quá nhỏ một cách phi thực tế.\n- Thực hiện chính xác mô tả sau: "${options.prompt}".\n- Tỷ lệ khung hình cuối cùng phải là ${options.aspectRatio}.\n\nĐẦU RA BẮT BUỘC: CHỈ MỘT HÌNH ẢNH.`;
        
        parts.push({ text: instruction });
        
        const results: string[] = [];
        for (let i = 0; i < options.numberOfVariations; i++) {
             const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts },
                config: {
                    // FIX: Per Gemini API guidelines, image editing models must include both IMAGE and TEXT modalities.
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            if (!imagePart || !imagePart.inlineData) {
                const textResponse = response.text || '(không có phản hồi văn bản)';
                throw new Error(`API không trả về hình ảnh như yêu cầu. Phản hồi văn bản: ${textResponse}`);
            }
            results.push(imagePart.inlineData.data);

            // Add a delay between requests to avoid hitting rate limits
            if (i < options.numberOfVariations - 1) {
                await delay(30000); // 30-second delay
            }
        }

        return results;

    } catch (error) {
        handleGeminiError(error, "Không thể chỉnh sửa ảnh. Vui lòng thử lại.");
    }
};

export const swapFaces = async (options: SwapOptions): Promise<string[]> => {
     try {
        const parts = [
            { text: "[KHUÔN MẶT NGUỒN]" },
            fileToGenerativePart(options.sourceFaceImage),
            { text: "[ẢNH ĐÍCH]" },
            fileToGenerativePart(options.targetImage),
            { text: `HÀNH ĐỘNG: HOÁN ĐỔI KHUÔN MẶT.\n\nQUY TẮC:\n- Lấy khuôn mặt từ [KHUÔN MẶT NGUỒN] và thay thế cho khuôn mặt của người trong [ẢNH ĐÍCH].\n- CỰC KỲ QUAN TRỌNG: PHẢI GIỮ NGUYÊN 100% tất cả các yếu tố khác của [ẢNH ĐÍCH], bao gồm: quần áo, tư thế, bối cảnh, ánh sáng, màu sắc và phong cách nghệ thuật.\n- Khuôn mặt mới phải được hoà trộn một cách tự nhiên và chân thực.\n- ${options.prompt ? `YÊU CẦU BỔ SUNG: ${options.prompt}` : ''}\n\nĐẦU RA BẮT BUỘC: CHỈ MỘT HÌNH ẢNH.` },
        ];
        
        const results: string[] = [];
        for (let i = 0; i < options.numberOfVariations; i++) {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts },
                config: {
                    // FIX: Per Gemini API guidelines, image editing models must include both IMAGE and TEXT modalities.
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });
            const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            if (!imagePart || !imagePart.inlineData) {
                const textResponse = response.text || '(không có phản hồi văn bản)';
                throw new Error(`API không trả về hình ảnh như yêu cầu. Phản hồi văn bản: ${textResponse}`);
            }
            results.push(imagePart.inlineData.data);

            // Add a delay between requests to avoid hitting rate limits
            if (i < options.numberOfVariations - 1) {
                await delay(30000); // 30-second delay
            }
        }
        
        return results;

    } catch (error) {
        handleGeminiError(error, "Không thể hoán đổi khuôn mặt. Vui lòng thử lại.");
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
        handleGeminiError(error, "Không thể thực hiện hành động. Vui lòng thử lại.");
    }
};

export const analyzeImage = async (options: AnalyzeOptions): Promise<string> => {
    try {
        const parts = [
            fileToGenerativePart(options.image),
            { text: 'Hãy mô tả chi tiết hình ảnh này. Tạo một prompt mô tả có thể được sử dụng để tạo ra một hình ảnh tương tự bằng trình tạo ảnh AI. Tập trung vào chủ thể, phong cách, bố cục, màu sắc và ánh sáng.' },
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
        });

        return response.text;
    } catch (error) {
        handleGeminiError(error, "Không thể phân tích ảnh. Vui lòng thử lại.");
    }
};

export const generateVideo = async (options: VideoOptions & { quality: OutputQuality }): Promise<string[]> => {
    try {
        const params: any = {
            model: 'veo-2.0-generate-001',
            prompt: options.prompt,
            config: {
                aspectRatio: options.aspectRatio,
                numberOfVideos: 1,
            },
        };

        if (options.image) {
            params.image = {
                imageBytes: options.image.base64,
                mimeType: options.image.mimeType,
            };
        }

        let operation = await ai.models.generateVideos(params);

        // Polling logic
        const maxPolls = 30; // 30 polls * 10s = 5 minutes timeout
        let pollCount = 0;
        while (!operation.done && pollCount < maxPolls) {
            pollCount++;
            await delay(10000); // Poll every 10 seconds
            try {
                operation = await ai.operations.getVideosOperation({ operation });
            } catch (e) {
                console.error('Error polling for operation status:', e);
                throw new Error('Không thể lấy trạng thái tạo video. Vui lòng thử lại.');
            }
        }

        if (!operation.done) {
            throw new Error('Quá trình tạo video đã hết thời gian. Vui lòng thử lại với một yêu cầu đơn giản hơn.');
        }

        const videos = operation.response?.generatedVideos;
        if (!videos || videos.length === 0) {
            throw new Error('Không có video nào được tạo. Yêu cầu của bạn có thể đã bị chặn.');
        }

        // Fetch the video and create a blob URL
        const videoData = videos[0];
        const url = decodeURIComponent(videoData.video.uri);
        const res = await fetch(`${url}&key=${process.env.API_KEY}`);
        
        if (!res.ok) {
            throw new Error(`Không thể tải video. Trạng thái: ${res.status}`);
        }
        
        const blob = await res.blob();
        const objectURL = URL.createObjectURL(blob);
        
        return [objectURL];

    } catch (error) {
        handleGeminiError(error, "Không thể tạo video. Vui lòng thử lại.");
    }
};

const parseJsonResponse = (jsonText: string): any => {
    let cleanedJsonText = jsonText.trim();
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = cleanedJsonText.match(jsonRegex);
    if (match && match[1]) {
        cleanedJsonText = match[1];
    }

    try {
        return JSON.parse(cleanedJsonText);
    } catch (parseError) {
         console.error("Failed to parse JSON response from AI:", cleanedJsonText);
         throw new Error("AI đã trả về một định dạng gợi ý không hợp lệ.");
    }
}

export const generateVideoIdeasFromImage = async (options: AnalyzeOptions): Promise<string[]> => {
    try {
        const parts = [
            fileToGenerativePart(options.image),
            { text: "Phân tích hình ảnh này. Với vai trò là một đạo diễn sáng tạo, hãy tạo ra 3 kịch bản video ngắn độc đáo dựa trên hình ảnh. Mỗi kịch bản phải mô tả hành động, chuyển động của máy quay và không khí tổng thể. Trả lời bằng tiếng Việt. Định dạng đầu ra phải là một đối tượng JSON có khóa 'suggestions' chứa một mảng các chuỗi kịch bản." }
        ];

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
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['suggestions']
                }
            }
        });
        
        const result = parseJsonResponse(response.text);
        return result.suggestions || [];

    } catch(error) {
        handleGeminiError(error, "Không thể tạo gợi ý video. Vui lòng thử lại.")
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
        
        const result = parseJsonResponse(response.text);
        return result.suggestions || [];

    } catch (error) {
        handleGeminiError(error, "Không thể tạo gợi ý. Vui lòng thử lại.");
    }
};