export type AppMode = 'generate' | 'edit' | 'swap' | 'magic' | 'analyze' | 'video';

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export type MagicAction = 'upscale' | 'remove-background' | 'color-correct' | 'remove-object' | 'change-background' | 'beautify-portrait';

export type OutputQuality = 'standard' | 'high' | 'maximum';

export interface ImageData {
  base64: string;
  mimeType: string;
}

export interface GenerateOptions {
  prompt: string;
  aspectRatio: AspectRatio;
  numberOfImages: number;
  quality: OutputQuality;
}

export interface EditOptions {
  prompt: string;
  aspectRatio: AspectRatio;
  characterImages: ImageData[];
  productImage?: ImageData;
  backgroundImage?: ImageData;
  numberOfVariations: number;
  quality: OutputQuality;
}

export interface SwapOptions {
  prompt: string;
  sourceFaceImage: ImageData;
  targetImage: ImageData;
  numberOfVariations: number;
  quality: OutputQuality;
}

export interface MagicOptions {
  action: MagicAction;
  image: ImageData;
  prompt?: string;
  quality: OutputQuality;
}

export interface AnalyzeOptions {
  image: ImageData;
}

export interface VideoOptions {
  prompt: string;
  aspectRatio: AspectRatio;
  image?: ImageData;
}

export interface SuggestionOptions {
  prompt: string;
  images?: ImageData[];
}

export interface CharacterPreset {
  id: string;
  name: string;
  images: ImageData[];
  prompt: string;
}
