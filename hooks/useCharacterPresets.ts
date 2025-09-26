import { useState, useEffect } from 'react';
import type { CharacterPreset, ImageData } from '../types';

const PRESETS_STORAGE_KEY = 'ai-character-presets';

export function useCharacterPresets() {
  const [presets, setPresets] = useState<CharacterPreset[]>([]);

  useEffect(() => {
    try {
      const storedPresets = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (storedPresets) {
        setPresets(JSON.parse(storedPresets));
      }
    } catch (error) {
      console.error('Failed to load character presets from local storage:', error);
      // If parsing fails, clear the corrupted data
      localStorage.removeItem(PRESETS_STORAGE_KEY);
    }
  }, []);

  const savePresets = (newPresets: CharacterPreset[]) => {
    setPresets(newPresets);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(newPresets));
  };

  const addPreset = (name: string, images: ImageData[], prompt: string) => {
    const newPreset: CharacterPreset = {
      id: `preset_${Date.now()}`,
      name,
      images,
      prompt,
    };
    savePresets([...presets, newPreset]);
  };

  const removePreset = (id: string) => {
    const updatedPresets = presets.filter(p => p.id !== id);
    savePresets(updatedPresets);
  };

  return { presets, addPreset, removePreset };
}
