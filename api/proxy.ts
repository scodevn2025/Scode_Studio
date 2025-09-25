// Note: This file should be placed in the `api` directory at the root of your project.
// Vercel will automatically detect it as a serverless function.

import { GoogleGenAI, Modality } from "@google/genai";
import type {
  GenerateOptions,
  EditOptions,
  SwapOptions,
  MagicOptions,
  ImageData,
} from '../types';

// This runs on the server, so we can safely use process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const getQualityPromptSuffix = (quality: any): string => {
  switch (quality) {
    case 'high':
      return ', 4K resolution, high detail, professional photography, sharp focus';
    case 'maximum':
      return ', 8K resolution, ultra-detailed, photorealistic, cinematic lighting, masterpiece';
    case 'standard':
    default:
      return '';
  }
};

const handleGenerate = async (options: GenerateOptions) => {
  const qualitySuffix = getQualityPromptSuffix(options.quality);
  const finalPrompt = `${options.prompt}${qualitySuffix}`;
  
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: finalPrompt,
    config: {
      numberOfImages: options.numberOfImages,
      aspectRatio: options.aspectRatio,
      outputMimeType: 'image/jpeg',
    },
  });

  return response.generatedImages.map(img => img.image.imageBytes);
};

const handleEdit = async (options: any) => { // Using any for simplicity as it's a direct pass-through
    const parts: any[] = [];
    const consistencyInstruction = `
      INSTRUCTION: You are an AI expert at character consistency. 
      The following image is a reference of a character. It is critically important that the character's face, hair, body shape, and unique identifying features are perfectly preserved and accurately recreated with high fidelity in the output image.
      Do not change the character's appearance under any circumstances.
    `;
    parts.push({ text: consistencyInstruction });
    parts.push({
      inlineData: { data: options.characterImage.base64, mimeType: options.characterImage.mimeType },
    });
    if (options.productImage) {
        parts.push({ text: "PRODUCT IMAGE: The following image is a product to be integrated into the scene." });
        parts.push({
            inlineData: { data: options.productImage.base64, mimeType: options.productImage.mimeType },
        });
    }
    const qualitySuffix = getQualityPromptSuffix(options.quality);
    const scenePrompt = `SCENE PROMPT: ${options.prompt}.`;
    let artDirection = `
      ART DIRECTION:
      1. **Character Realism:** Create a photorealistic image. The character must be realistically scaled and proportioned relative to the background. Pay close attention to perspective, depth, and correct lighting/shadows to ensure the final composition is believable.
    `;
    if (options.productImage) {
        artDirection += `
      2. **Product Integration:** Seamlessly integrate the provided product into the scene. The character should interact with it naturally (e.g., a realistic grip). The product's lighting, shadows, and reflections must perfectly match the environment.
        `;
    }
    artDirection += `
      QUALITY: The final image must be of exceptional quality, reflecting these characteristics: ${qualitySuffix || 'standard quality'}.
    `;
    parts.push({ text: scenePrompt });
    parts.push({ text: artDirection });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return part.inlineData.data;
    }
    return null;
};

const handleSwap = async (options: any) => {
    const qualitySuffix = getQualityPromptSuffix(options.quality);
    const instructionPrompt = `INSTRUCTION: Take the face from IMAGE 1 and expertly blend it onto the person in IMAGE 2. Preserve the background, lighting, clothing, and body of IMAGE 2. The final image should look realistic and seamless. The output must be of high quality, reflecting these characteristics: ${qualitySuffix || 'standard quality'}. Additional user instructions: ${options.prompt}`;
    const parts = [
        { text: "IMAGE 1: This is the source face." },
        { inlineData: { data: options.sourceFaceImage.base64, mimeType: options.sourceFaceImage.mimeType } },
        { text: "IMAGE 2: This is the target image where the face should be placed." },
        { inlineData: { data: options.targetImage.base64, mimeType: options.targetImage.mimeType } },
        { text: instructionPrompt },
    ];
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return part.inlineData.data;
    }
    return null;
};

const handleMagic = async (options: MagicOptions) => {
    let prompt = '';
    switch (options.action) {
      case 'upscale': prompt = 'Upscale this image to a higher resolution, enhance details, and improve overall quality. Make the image sharper and clearer.'; break;
      case 'remove-background': prompt = 'Perfectly remove the background of this image, leaving only the main subject. The output should have a transparent background.'; break;
      case 'color-correct': prompt = 'Automatically correct the colors, contrast, and brightness of this image to make it look more vibrant, professional, and balanced.'; break;
      case 'remove-object': prompt = `Carefully remove the object described as "${options.prompt}" from this image. Inpaint the area where the object was removed so that it blends seamlessly and realistically with the surrounding background. The final result should look natural, as if the object was never there.`; break;
      case 'change-background': prompt = `INSTRUCTION: You are a professional photo editor. Your task is to perform a background replacement. 1. **Identify the primary subject(s)** in the provided image. 2. **Isolate the subject(s) perfectly.** Do not alter the subject(s) in any way - their appearance, color, and form must remain identical. 3. **Completely remove the original background.** 4. **Generate a new, photorealistic background** based on this description: "${options.prompt}". 5. **Integrate the subject(s) seamlessly** into the new background. This is critical. The lighting, shadows, reflections, and perspective on the subject(s) must be adjusted to perfectly match the new environment. The final image must look like a single, cohesive photograph.`; break;
      case 'beautify-portrait': prompt = 'Perform a professional portrait retouch on this image. Subtly smooth the skin while retaining natural texture, brighten the eyes, gently whiten the teeth if visible, and enhance the overall lighting to be more flattering. The result should be a natural, beautified portrait, not an artificial or "plastic" look.'; break;
    }
    const qualitySuffix = getQualityPromptSuffix(options.quality);
    prompt = `${prompt} The final output must be of high quality, reflecting these characteristics: ${qualitySuffix || 'standard quality'}.`;
    const parts = [
      { inlineData: { data: options.image.base64, mimeType: options.image.mimeType } },
      { text: prompt },
    ];
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return part.inlineData.data;
    }
    return null;
};

const handleAnalyze = async (options: { image: ImageData }) => {
    const prompt = `You are an expert prompt engineer. Analyze the following image in detail. Generate a descriptive, high-quality prompt that could be used by an AI image generator to recreate a similar image. Describe the subject, their clothing, the setting, the lighting, the atmosphere, and the artistic style (e.g., photorealistic, anime, etc.). Be concise but comprehensive.`;
    const parts = [
      { text: prompt },
      { inlineData: { data: options.image.base64, mimeType: options.image.mimeType } },
    ];
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
    });
    return response.text.trim();
};


export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { type, options } = req.body;

    switch (type) {
      case 'generate':
        const genResults = await handleGenerate(options);
        return res.status(200).json({ results: genResults });
      case 'edit':
        const editResult = await handleEdit(options);
        return res.status(200).json({ result: editResult });
      case 'swap':
        const swapResult = await handleSwap(options);
        return res.status(200).json({ result: swapResult });
      case 'magic':
        const magicResult = await handleMagic(options);
        return res.status(200).json({ result: magicResult });
      case 'analyze':
        const analyzeResult = await handleAnalyze(options);
        return res.status(200).json({ result: analyzeResult });
      default:
        return res.status(400).json({ error: 'Invalid action type' });
    }
  } catch (error) {
    console.error('API Proxy Error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'An internal server error occurred' });
  }
}
