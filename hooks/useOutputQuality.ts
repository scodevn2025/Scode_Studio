import { useState, useEffect, useCallback } from 'react';
import type { OutputQuality } from '../types';

const STORAGE_KEY = 'output-quality';

const isValidQuality = (value: any): value is OutputQuality => {
  return ['standard', 'high', 'maximum'].includes(value);
};

export const useOutputQuality = (): [OutputQuality, (quality: OutputQuality) => void] => {
  const [quality, setQuality] = useState<OutputQuality>('high'); // Default to 'high'

  useEffect(() => {
    try {
      const storedQuality = localStorage.getItem(STORAGE_KEY);
      if (storedQuality && isValidQuality(storedQuality)) {
        setQuality(storedQuality);
      }
    } catch (error) {
      console.error("Failed to load output quality from localStorage", error);
    }
  }, []);

  const updateQuality = useCallback((newQuality: OutputQuality) => {
    try {
      if (isValidQuality(newQuality)) {
        setQuality(newQuality);
        localStorage.setItem(STORAGE_KEY, newQuality);
      }
    } catch (error) {
      console.error("Failed to save output quality to localStorage", error);
    }
  }, []);

  return [quality, updateQuality];
};
