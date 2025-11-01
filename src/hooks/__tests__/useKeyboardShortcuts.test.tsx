import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { ReactNode } from 'react';

// Wrapper component to provide SettingsContext
const wrapper = ({ children }: { children: ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

describe('useKeyboardShortcuts', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should register keyboard event listener on mount', () => {
      renderHook(() => useKeyboardShortcuts({}), { wrapper });

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should cleanup event listener on unmount', () => {
      const { unmount } = renderHook(() => useKeyboardShortcuts({}), { wrapper });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Shortcut Triggering', () => {
    it('should call onSave when save shortcut is pressed (Mod+s)', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }), { wrapper });

      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true, // Mac
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('should call onSave when save shortcut is pressed with Ctrl on Windows/Linux', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }), { wrapper });

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true, // Windows/Linux
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('should call onOpenSettings when settings shortcut is pressed (Mod+,)', () => {
      const onOpenSettings = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onOpenSettings }), { wrapper });

      const event = new KeyboardEvent('keydown', {
        key: ',',
        metaKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onOpenSettings).toHaveBeenCalledTimes(1);
    });

    it('should call onTogglePreview when preview shortcut is pressed (Mod+p)', () => {
      const onTogglePreview = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onTogglePreview }), { wrapper });

      const event = new KeyboardEvent('keydown', {
        key: 'p',
        metaKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onTogglePreview).toHaveBeenCalledTimes(1);
    });

    it('should call onToggleEditor when editor shortcut is pressed (Mod+e)', () => {
      const onToggleEditor = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToggleEditor }), { wrapper });

      const event = new KeyboardEvent('keydown', {
        key: 'e',
        metaKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onToggleEditor).toHaveBeenCalledTimes(1);
    });

    it('should call onNewFile when new file shortcut is pressed (Mod+n)', () => {
      const onNewFile = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onNewFile }), { wrapper });

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        metaKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onNewFile).toHaveBeenCalledTimes(1);
    });

    it('should call onNewFolder when new folder shortcut is pressed (Mod+Shift+n)', () => {
      const onNewFolder = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onNewFolder }), { wrapper });

      const event = new KeyboardEvent('keydown', {
        key: 'N', // Capital N when Shift is pressed
        metaKey: true,
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onNewFolder).toHaveBeenCalledTimes(1);
    });
  });

  describe('Input Field Detection', () => {
    it('should not trigger shortcuts when typing in an input field', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }), { wrapper });

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', { value: input, enumerable: true });
      document.dispatchEvent(event);

      expect(onSave).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should not trigger shortcuts when typing in a textarea', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }), { wrapper });

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', { value: textarea, enumerable: true });
      document.dispatchEvent(event);

      expect(onSave).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('should not trigger shortcuts when typing in a contenteditable element', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }), { wrapper });

      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', { value: div, enumerable: true });
      document.dispatchEvent(event);

      expect(onSave).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });
  });

  describe('Prevent Default Behavior', () => {
    it('should prevent default browser behavior for save shortcut', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }), { wrapper });

      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not prevent default if no handler is registered for the shortcut', () => {
      renderHook(() => useKeyboardShortcuts({}), { wrapper });

      const event = new KeyboardEvent('keydown', {
        key: 'x',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Handlers', () => {
    it('should support multiple different shortcuts working independently', () => {
      const onSave = vi.fn();
      const onOpenSettings = vi.fn();
      const onNewFile = vi.fn();

      renderHook(
        () =>
          useKeyboardShortcuts({
            onSave,
            onOpenSettings,
            onNewFile,
          }),
        { wrapper }
      );

      // Trigger save
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 's', metaKey: true, bubbles: true })
      );
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onOpenSettings).not.toHaveBeenCalled();
      expect(onNewFile).not.toHaveBeenCalled();

      // Trigger settings
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: ',', metaKey: true, bubbles: true })
      );
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onOpenSettings).toHaveBeenCalledTimes(1);
      expect(onNewFile).not.toHaveBeenCalled();

      // Trigger new file
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'n', metaKey: true, bubbles: true })
      );
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onOpenSettings).toHaveBeenCalledTimes(1);
      expect(onNewFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('Handler Updates', () => {
    it('should use updated handlers when they change', () => {
      const onSave1 = vi.fn();
      const onSave2 = vi.fn();

      const { rerender } = renderHook(
        ({ handler }: { handler: () => void }) => useKeyboardShortcuts({ onSave: handler }),
        {
          wrapper,
          initialProps: { handler: onSave1 },
        }
      );

      // Trigger with first handler
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 's', metaKey: true, bubbles: true })
      );
      expect(onSave1).toHaveBeenCalledTimes(1);
      expect(onSave2).not.toHaveBeenCalled();

      // Update handler
      rerender({ handler: onSave2 });

      // Trigger with second handler
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 's', metaKey: true, bubbles: true })
      );
      expect(onSave1).toHaveBeenCalledTimes(1); // Should not be called again
      expect(onSave2).toHaveBeenCalledTimes(1); // New handler should be called
    });
  });
});
