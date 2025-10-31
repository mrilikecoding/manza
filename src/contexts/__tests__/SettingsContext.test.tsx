import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SettingsProvider, useSettings } from '../SettingsContext';

describe('SettingsContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Default Settings', () => {
    it('should load default settings on first use', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      expect(result.current.settings).toEqual({
        theme: 'system',
        autoSave: true,
        vimMode: false,
        keyboardShortcuts: {
          save: 'Mod+s',
          bold: 'Mod+b',
          italic: 'Mod+i',
          openSettings: 'Mod+,',
          togglePreview: 'Mod+p',
          toggleEditor: 'Mod+e',
          newFile: 'Mod+n',
          newFolder: 'Mod+Shift+n',
        },
      });
    });
  });

  describe('Settings Persistence', () => {
    it('should save settings to localStorage when updated', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      act(() => {
        result.current.updateSettings({ autoSave: false });
      });

      const stored = localStorage.getItem('manza_settings');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.autoSave).toBe(false);
    });

    it('should restore settings from localStorage on initialization', () => {
      // Set up localStorage with custom settings
      const customSettings = {
        theme: 'dark',
        autoSave: false,
        vimMode: true,
        keyboardShortcuts: {
          save: 'Mod+s',
          bold: 'Mod+b',
          italic: 'Mod+i',
          openSettings: 'Mod+,',
          togglePreview: 'Mod+p',
          toggleEditor: 'Mod+e',
          newFile: 'Mod+n',
          newFolder: 'Mod+Shift+n',
        },
      };
      localStorage.setItem('manza_settings', JSON.stringify(customSettings));

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.settings.autoSave).toBe(false);
      expect(result.current.settings.vimMode).toBe(true);
    });
  });

  describe('Update Settings', () => {
    it('should update settings when updateSettings is called', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      act(() => {
        result.current.updateSettings({ theme: 'dark', autoSave: false });
      });

      expect(result.current.settings.theme).toBe('dark');
      expect(result.current.settings.autoSave).toBe(false);
    });

    it('should partially update settings without affecting other values', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      act(() => {
        result.current.updateSettings({ vimMode: true });
      });

      expect(result.current.settings.vimMode).toBe(true);
      expect(result.current.settings.autoSave).toBe(true); // Should remain default
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should update individual keyboard shortcuts', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      act(() => {
        result.current.updateShortcut('save', 'Ctrl+Shift+s');
      });

      expect(result.current.settings.keyboardShortcuts.save).toBe('Ctrl+Shift+s');
      expect(result.current.settings.keyboardShortcuts.bold).toBe('Mod+b'); // Others unchanged
    });

    it('should reset all shortcuts to defaults', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      // First customize a shortcut
      act(() => {
        result.current.updateShortcut('save', 'Ctrl+Shift+s');
        result.current.updateShortcut('bold', 'Ctrl+Shift+b');
      });

      // Then reset
      act(() => {
        result.current.resetShortcuts();
      });

      expect(result.current.settings.keyboardShortcuts.save).toBe('Mod+s');
      expect(result.current.settings.keyboardShortcuts.bold).toBe('Mod+b');
    });
  });

  describe('Reset All Settings', () => {
    it('should reset all settings to defaults', () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      // Customize settings
      act(() => {
        result.current.updateSettings({ theme: 'dark', autoSave: false, vimMode: true });
        result.current.updateShortcut('save', 'Ctrl+Shift+s');
      });

      // Reset
      act(() => {
        result.current.resetAllSettings();
      });

      expect(result.current.settings.theme).toBe('system');
      expect(result.current.settings.autoSave).toBe(true);
      expect(result.current.settings.vimMode).toBe(false);
      expect(result.current.settings.keyboardShortcuts.save).toBe('Mod+s');
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('manza_settings', 'invalid json{');

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      // Should fall back to defaults
      expect(result.current.settings.theme).toBe('system');
      expect(result.current.settings.autoSave).toBe(true);
    });

    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useSettings());
      }).toThrow('useSettings must be used within a SettingsProvider');
    });
  });
});
