import { useState, useEffect } from 'react';
import type { OutputQuality } from '../types';

const QUALITY_STORAGE_KEY = 'ai-output-quality';

export function useOutputQuality(): [OutputQuality, (quality: OutputQuality) => void] {
  const [quality, setQuality] = useState<OutputQuality>(() => {
    try {
      const storedQuality = localStorage.getItem(QUALITY_STORAGE_KEY);
      if (storedQuality && ['standard', 'high', 'maximum'].includes(storedQuality)) {
        return storedQuality as OutputQuality;
      }
    } catch (error) {
      console.error('Failed to load quality from local storage:', error);
    }
    return 'standard'; // Default value
  });

  useEffect(() => {
    try {
        localStorage.setItem(QUALITY_STORAGE_KEY, quality);
    } catch (error) {
        console.error('Failed to save quality to local storage:', error);
    }
  }, [quality]);

  return [quality, setQuality];
}
