// This file now acts as a client-side fetcher to our own backend API proxy.
import type {
  GenerateOptions,
  EditOptions,
  SwapOptions,
  MagicOptions,
  ImageData,
} from '../types';

async function callApiProxy(endpoint: string, body: object) {
  const response = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
    throw new Error(errorBody.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const generateImages = async (options: GenerateOptions): Promise<(string | null)[]> => {
  const { results } = await callApiProxy('proxy', { type: 'generate', options });
  return results;
};

export const editImage = async (options: {
  prompt: string;
  characterImage: ImageData;
  productImage?: ImageData;
  quality: any;
}): Promise<string | null> => {
   const { result } = await callApiProxy('proxy', { type: 'edit', options });
   return result;
};

export const swapFace = async (options: {
  prompt: string;
  sourceFaceImage: ImageData;
  targetImage: ImageData;
  quality: any;
}): Promise<string | null> => {
  const { result } = await callApiProxy('proxy', { type: 'swap', options });
  return result;
};

export const magicEditImage = async (options: MagicOptions): Promise<string | null> => {
  const { result } = await callApiProxy('proxy', { type: 'magic', options });
  return result;
};

export const analyzeImageAndGetPrompt = async (image: ImageData): Promise<string> => {
  const { result } = await callApiProxy('proxy', { type: 'analyze', options: { image } });
  return result;
};
