import { AspectRatio, MagicAction, OutputQuality } from "./types";

export const ASPECT_RATIOS: AspectRatio[] = ['1:1', '3:4', '4:3', '9:16', '16:9'];

export const MAGIC_ACTIONS: { id: MagicAction, name: string }[] = [
    { id: 'upscale', name: 'Nâng cấp chất lượng' },
    { id: 'remove-background', name: 'Xóa nền' },
    { id: 'color-correct', name: 'Tự động sửa màu' },
    { id: 'remove-object', name: 'Xóa vật thể' },
    { id: 'change-background', name: 'Đổi nền' },
    { id: 'beautify-portrait', name: 'Làm đẹp chân dung' },
];

export const OUTPUT_QUALITIES: { id: OutputQuality, name: string }[] = [
    { id: 'standard', name: 'Tiêu chuẩn' },
    { id: 'high', name: 'Cao' },
    { id: 'maximum', name: 'Tối đa' },
];

// FIX: Added PROMPT_SUGGESTION_TAGS to be used in ControlPanel.tsx for prompt suggestions.
export const PROMPT_SUGGESTION_TAGS: { [key: string]: string[] } = {
    'Phong cách (Style)': ['cinematic', 'photorealistic', 'anime', 'watercolor', 'digital art', 'line art', '3d render'],
    'Chi tiết (Detail)': ['highly detailed', '4k', '8k', 'sharp focus', 'intricate details', 'masterpiece'],
    'Ánh sáng (Lighting)': ['volumetric lighting', 'dramatic lighting', 'studio lighting', 'golden hour', 'neon lighting', 'rim light'],
    'Màu sắc (Color)': ['vibrant colors', 'monochromatic', 'pastel colors', 'black and white'],
};

export const LOADING_MESSAGES: string[] = [
    "AI đang pha cà phê và suy nghĩ...",
    "Các нейрон đang kết nối...",
    "Đang vẽ từng pixel một...",
    "Tham khảo ý kiến từ các danh hoạ...",
    "Đang triệu hồi sức mạnh sáng tạo...",
    "Một chút ma thuật đang được thêm vào...",
    "Sắp xong rồi, kiệt tác đang hình thành!",
    "Đang dựng phim, xin chờ trong giây lát...",
    "AI đạo diễn đang hô 'diễn'!",
    "Kết xuất từng khung hình video...",
    "Quá trình này có thể mất vài phút, cảm ơn bạn đã kiên nhẫn."
];
