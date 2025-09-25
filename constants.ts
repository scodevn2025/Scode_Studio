import type { AppMode, AspectRatio } from './types';

export const ASPECT_RATIOS: AspectRatio[] = ['9:16', '16:9', '3:4', '4:3', '1:1'];

export const PREDEFINED_PROMPTS: Record<AppMode, { name: string, value: string }[]> = {
  generate: [
    { name: 'Hoạt hình Anime', value: 'anime style, beautiful, detailed, cinematic lighting' },
    { name: 'Chân dung Siêu thực', value: 'photorealistic portrait, 4k, ultra detailed, natural lighting' },
    { name: 'Nữ sinh Áo dài', value: 'Vietnamese high school girl wearing a white Ao Dai, riding a bicycle on a sunny street with trees' },
    { name: 'Viễn tưởng Cyberpunk', value: 'cyberpunk character, Ho Chi Minh City night scene with neon signs background, futuristic clothing' },
  ],
  edit: [
    { name: 'Ảnh Studio', value: 'professional studio headshot, clean off-white background, soft lighting, high resolution' },
    { name: 'Cà phê Sài Gòn', value: 'sitting at a stylish sidewalk cafe in Saigon, drinking iced coffee (cà phê sữa đá), soft morning light' },
    { name: 'Dạo phố Hà Nội', value: 'street style fashion photo, walking in Hanoi Old Quarter, vibrant background, ancient architecture, candid shot' },
    { name: 'Biển Đà Nẵng', value: 'on the beautiful My Khe beach in Da Nang during sunset, vibrant colors in the sky, gentle waves' },
    { name: 'Check-in Tết', value: 'celebrating Vietnamese Tet holiday, wearing a beautiful red Ao Dai, posing with apricot blossoms (hoa mai) or peach blossoms (hoa đào)' },
    { name: 'Du thuyền Hạ Long', value: 'standing on a cruise ship in Ha Long Bay, surrounded by limestone karsts and emerald green water, majestic scenery' },
  ],
  swap: [
    { name: 'Cười tươi', value: 'make the person have a wide, happy smile' },
    { name: 'Tóc xanh', value: 'change the hair color to vibrant blue' },
    { name: 'Đeo kính râm', value: 'add stylish sunglasses to the face' },
    { name: 'Trẻ hơn', value: 'make the person look about 10 years younger' },
  ],
  magic: [], // Magic mode uses actions, not text prompts from the user
};

export const LOADING_MESSAGES: string[] = [
  "AI đang vận dụng trí tuệ nhân tạo...",
  "Đang tìm kiếm nguồn cảm hứng trong vũ trụ số...",
  "Các nơ-ron nhân tạo đang kết nối...",
  "Đang phác thảo những đường nét đầu tiên...",
  "Thêm chút màu sắc và ánh sáng ma thuật...",
  "Sắp hoàn thành rồi, kiệt tác đang đến!",
];