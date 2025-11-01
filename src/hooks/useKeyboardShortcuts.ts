import { useEffect, useCallback, useRef } from 'react';
import { useSettings, type KeyboardShortcuts } from '../contexts/SettingsContext';

export interface KeyboardShortcutHandlers {
  onSave?: () => void;
  onBold?: () => void;
  onItalic?: () => void;
  onOpenSettings?: () => void;
  onTogglePreview?: () => void;
  onToggleEditor?: () => void;
  onNewFile?: () => void;
  onNewFolder?: () => void;
}

type ShortcutKey = keyof KeyboardShortcuts;

/**
 * Hook to manage keyboard shortcuts throughout the application.
 * Supports cross-platform shortcuts using "Mod" key (Cmd on Mac, Ctrl on Windows/Linux).
 * Automatically prevents shortcuts from firing in input fields.
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const { settings } = useSettings();
  const handlersRef = useRef(handlers);

  // Keep handlers ref up to date without re-registering event listener
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  /**
   * Parse a shortcut string (e.g., "Mod+s") into its components
   */
  const parseShortcut = useCallback((shortcut: string) => {
    const parts = shortcut.split('+');
    const hasShift = parts.some(p => p.toLowerCase() === 'shift');
    const hasMod = parts.some(p => p.toLowerCase() === 'mod');
    const key = parts[parts.length - 1].toLowerCase();

    return { key, hasMod, hasShift };
  }, []);

  /**
   * Check if a keyboard event matches a shortcut string
   */
  const matchesShortcut = useCallback(
    (event: KeyboardEvent, shortcut: string): boolean => {
      const { key, hasMod, hasShift } = parseShortcut(shortcut);
      const eventKey = event.key.toLowerCase();

      // Check if Mod key matches (metaKey on Mac, ctrlKey on Windows/Linux)
      const modKeyPressed = event.metaKey || event.ctrlKey;
      if (hasMod && !modKeyPressed) return false;
      if (!hasMod && modKeyPressed) return false;

      // Check if Shift key matches
      if (hasShift && !event.shiftKey) return false;
      if (!hasShift && event.shiftKey && eventKey !== key) return false;

      // Check if the key matches
      return eventKey === key;
    },
    [parseShortcut]
  );

  /**
   * Check if the event target is an input field where we shouldn't intercept shortcuts
   */
  const isInputField = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;

    const tagName = target.tagName.toLowerCase();
    const isContentEditable = target.contentEditable === 'true';

    return tagName === 'input' || tagName === 'textarea' || isContentEditable;
  }, []);

  /**
   * Main keyboard event handler
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't intercept shortcuts in input fields
      if (isInputField(event.target)) {
        return;
      }

      const shortcuts = settings.keyboardShortcuts;
      const handlers = handlersRef.current;

      // Map shortcuts to their handlers
      const shortcutMap: Array<{ key: ShortcutKey; handler?: () => void }> = [
        { key: 'save', handler: handlers.onSave },
        { key: 'bold', handler: handlers.onBold },
        { key: 'italic', handler: handlers.onItalic },
        { key: 'openSettings', handler: handlers.onOpenSettings },
        { key: 'togglePreview', handler: handlers.onTogglePreview },
        { key: 'toggleEditor', handler: handlers.onToggleEditor },
        { key: 'newFile', handler: handlers.onNewFile },
        { key: 'newFolder', handler: handlers.onNewFolder },
      ];

      // Check each shortcut
      for (const { key, handler } of shortcutMap) {
        if (handler && matchesShortcut(event, shortcuts[key])) {
          event.preventDefault();
          handler();
          return;
        }
      }
    },
    [settings.keyboardShortcuts, isInputField, matchesShortcut]
  );

  // Register and cleanup event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
