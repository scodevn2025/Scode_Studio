import { useState, useEffect, useCallback } from 'react';
import type { CharacterPreset, ImageData } from '../types';

const STORAGE_KEY = 'character-presets';

export const useCharacterPresets = () => {
  const [presets, setPresets] = useState<CharacterPreset[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedPresets = localStorage.getItem(STORAGE_KEY);
      if (storedPresets) {
        setPresets(JSON.parse(storedPresets));
      }
    } catch (error) {
      console.error("Failed to load character presets from localStorage", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const savePresets = useCallback((newPresets: CharacterPreset[]) => {
    try {
      setPresets(newPresets);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
    } catch (error) {
      console.error("Failed to save character presets to localStorage", error);
    }
  }, []);

  const addPreset = useCallback((name: string, images: ImageData[], prompt: string) => {
    if (!name.trim() || images.length === 0) return;
    const newPreset: CharacterPreset = {
      id: Date.now().toString(),
      name,
      images,
      prompt,
    };
    savePresets([...presets, newPreset]);
  }, [presets, savePresets]);

  const removePreset = useCallback((id: string) => {
    const newPresets = presets.filter(p => p.id !== id);
    savePresets(newPresets);
  }, [presets, savePresets]);

  const updatePreset = useCallback((id: string, updatedPreset: Partial<CharacterPreset>) => {
      const newPresets = presets.map(p => p.id === id ? { ...p, ...updatedPreset } : p);
      savePresets(newPresets);
  }, [presets, savePresets]);

  return { presets, addPreset, removePreset, updatePreset, isLoaded };
};
