import { GoogleGenAI, Modality } from "@google/genai";
import type {
  GenerateOptions,
  MagicOptions,
  ImageData,
  OutputQuality,
} from '../types';

// FIX: Per coding guidelines, the API key must be obtained from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getQualityPromptSuffix = (quality: OutputQuality): string => {
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

/**
 * Generates images based on a text prompt using the 'imagen-4.0-generate-001' model.
 * @param options - Configuration for image generation, including prompt, aspect ratio, and number of images.
 * @returns An array of base64 encoded image strings, or null for failed generations.
 */
export const generateImages = async (
  options: GenerateOptions
): Promise<(string | null)[]> => {
  try {
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

    return response.generatedImages.map(
      (img) => img.image.imageBytes
    );
  } catch (error) {
    console.error('Error generating images:', error);
    return Array(options.numberOfImages).fill(null);
  }
};

/**
 * Edits an image using a prompt and one or more source images with the 'gemini-2.5-flash-image-preview' model.
 * @param options - Contains the prompt, a character image, and an optional product image.
 * @returns A base64 encoded image string if successful, otherwise null.
 */
export const editImage = async (options: {
  prompt: string;
  characterImage: ImageData;
  productImage?: ImageData;
  quality: OutputQuality;
}): Promise<string | null> => {
  try {
    const parts: any[] = [];
    
    const consistencyInstruction = `
      INSTRUCTION: You are an AI expert at character consistency. 
      The following image is a reference of a character. It is critically important that the character's face, hair, body shape, and unique identifying features are perfectly preserved and accurately recreated with high fidelity in the output image.
      Do not change the character's appearance under any circumstances.
    `;
    parts.push({ text: consistencyInstruction });

    parts.push({
      inlineData: {
        data: options.characterImage.base64,
        mimeType: options.characterImage.mimeType,
      },
    });

    if (options.productImage) {
        parts.push({ text: "PRODUCT IMAGE: The following image is a product to be integrated into the scene." });
        parts.push({
            inlineData: {
                data: options.productImage.base64,
                mimeType: options.productImage.mimeType,
            },
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
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }

    return null;
  } catch (error) {
    console.error('Error editing image:', error);
    return null;
  }
};

/**
 * Swaps a face from a source image to a target image using the 'gemini-2.5-flash-image-preview' model.
 * @param options - Contains the prompt, a source face image, and a target image.
 * @returns A base64 encoded image string if successful, otherwise null.
 */
export const swapFace = async (options: {
    prompt: string;
    sourceFaceImage: ImageData;
    targetImage: ImageData;
    quality: OutputQuality;
}): Promise<string | null> => {
  try {
    const qualitySuffix = getQualityPromptSuffix(options.quality);
    const instructionPrompt = `INSTRUCTION: Take the face from IMAGE 1 and expertly blend it onto the person in IMAGE 2. Preserve the background, lighting, clothing, and body of IMAGE 2. The final image should look realistic and seamless. The output must be of high quality, reflecting these characteristics: ${qualitySuffix || 'standard quality'}. Additional user instructions: ${options.prompt}`;
    
    const parts = [
        { text: "IMAGE 1: This is the source face." },
        {
            inlineData: {
                data: options.sourceFaceImage.base64,
                mimeType: options.sourceFaceImage.mimeType,
            },
        },
        { text: "IMAGE 2: This is the target image where the face should be placed." },
        {
            inlineData: {
                data: options.targetImage.base64,
                mimeType: options.targetImage.mimeType,
            },
        },
        { text: instructionPrompt },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error swapping face:', error);
    return null;
  }
};

/**
 * Performs a single "magic" edit action on an image using the 'gemini-2.5-flash-image-preview' model.
 * @param options - Contains the action to perform (e.g., 'upscale') and the source image.
 * @returns A base64 encoded image string if successful, otherwise null.
 */
export const magicEditImage = async (
  options: MagicOptions
): Promise<string | null> => {
  try {
    let prompt = '';
    switch (options.action) {
      case 'upscale':
        prompt = 'Upscale this image to a higher resolution, enhance details, and improve overall quality. Make the image sharper and clearer.';
        break;
      case 'remove-background':
        prompt = 'Perfectly remove the background of this image, leaving only the main subject. The output should have a transparent background.';
        break;
      case 'color-correct':
        prompt = 'Automatically correct the colors, contrast, and brightness of this image to make it look more vibrant, professional, and balanced.';
        break;
      case 'remove-object':
        if (!options.prompt) {
          console.warn('Magic action "remove-object" requires a prompt.');
          return null;
        }
        prompt = `Carefully remove the object described as "${options.prompt}" from this image. Inpaint the area where the object was removed so that it blends seamlessly and realistically with the surrounding background. The final result should look natural, as if the object was never there.`;
        break;
      case 'change-background':
        if (!options.prompt) {
          console.warn('Magic action "change-background" requires a prompt.');
          return null;
        }
        prompt = `
          INSTRUCTION: You are a professional photo editor. Your task is to perform a background replacement.

          1. **Identify the primary subject(s)** in the provided image.
          2. **Isolate the subject(s) perfectly.** Do not alter the subject(s) in any way - their appearance, color, and form must remain identical.
          3. **Completely remove the original background.**
          4. **Generate a new, photorealistic background** based on this description: "${options.prompt}".
          5. **Integrate the subject(s) seamlessly** into the new background. This is critical. The lighting, shadows, reflections, and perspective on the subject(s) must be adjusted to perfectly match the new environment. The final image must look like a single, cohesive photograph.
        `;
        break;
      case 'beautify-portrait':
        prompt = 'Perform a professional portrait retouch on this image. Subtly smooth the skin while retaining natural texture, brighten the eyes, gently whiten the teeth if visible, and enhance the overall lighting to be more flattering. The result should be a natural, beautified portrait, not an artificial or "plastic" look.';
        break;
      default:
        console.warn(`Unknown magic action: ${options.action}`);
        return null;
    }

    const qualitySuffix = getQualityPromptSuffix(options.quality);
    prompt = `${prompt} The final output must be of high quality, reflecting these characteristics: ${qualitySuffix || 'standard quality'}.`;
    
    const parts = [
      {
        inlineData: {
          data: options.image.base64,
          mimeType: options.image.mimeType,
        },
      },
      { text: prompt },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error with magic edit action '${options.action}':`, error);
    return null;
  }
};

/**
 * Analyzes an image and generates a descriptive text prompt.
 * @param image - The image data to analyze.
 * @returns A string containing the generated prompt.
 */
export const analyzeImageAndGetPrompt = async (image: ImageData): Promise<string> => {
  try {
    const prompt = `You are an expert prompt engineer. Analyze the following image in detail. Generate a descriptive, high-quality prompt that could be used by an AI image generator to recreate a similar image. Describe the subject, their clothing, the setting, the lighting, the atmosphere, and the artistic style (e.g., photorealistic, anime, etc.). Be concise but comprehensive.`;

    const parts = [
      { text: prompt },
      {
        inlineData: {
          data: image.base64,
          mimeType: image.mimeType,
        },
      },
    ];
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
    });

    return response.text.trim();
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image.');
  }
};
