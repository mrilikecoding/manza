import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface KeyboardShortcuts {
  save: string;
  bold: string;
  italic: string;
  openSettings: string;
  togglePreview: string;
  toggleEditor: string;
  newFile: string;
  newFolder: string;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  vimMode: boolean;
  keyboardShortcuts: KeyboardShortcuts;
}

const DEFAULT_SHORTCUTS: KeyboardShortcuts = {
  save: 'Mod+s',
  bold: 'Mod+b',
  italic: 'Mod+i',
  openSettings: 'Mod+,',
  togglePreview: 'Mod+p',
  toggleEditor: 'Mod+e',
  newFile: 'Mod+n',
  newFolder: 'Mod+Shift+n',
};

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  autoSave: true,
  vimMode: false,
  keyboardShortcuts: DEFAULT_SHORTCUTS,
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  updateShortcut: (action: keyof KeyboardShortcuts, shortcut: string) => void;
  resetShortcuts: () => void;
  resetAllSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'manza_settings';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    // Load from localStorage on initialization
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all keys exist
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          keyboardShortcuts: {
            ...DEFAULT_SHORTCUTS,
            ...parsed.keyboardShortcuts,
          },
        };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return DEFAULT_SETTINGS;
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const updateShortcut = (action: keyof KeyboardShortcuts, shortcut: string) => {
    setSettings(prev => ({
      ...prev,
      keyboardShortcuts: {
        ...prev.keyboardShortcuts,
        [action]: shortcut,
      },
    }));
  };

  const resetShortcuts = () => {
    setSettings(prev => ({
      ...prev,
      keyboardShortcuts: DEFAULT_SHORTCUTS,
    }));
  };

  const resetAllSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateShortcut,
        resetShortcuts,
        resetAllSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
