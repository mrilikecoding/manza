import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsModal } from '../SettingsModal';
import { SettingsProvider } from '../../../contexts/SettingsContext';

describe('SettingsModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Visibility', () => {
    it('should render when isOpen is true', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} />
        </SettingsProvider>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/settings/i)).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} isOpen={false} />
        </SettingsProvider>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should call onClose when Escape key is pressed', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} />
        </SettingsProvider>
      );

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} />
        </SettingsProvider>
      );

      const backdrop = screen.getByTestId('modal-backdrop');
      fireEvent.click(backdrop);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close when clicking inside modal content', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} />
        </SettingsProvider>
      );

      const modalContent = screen.getByRole('dialog');
      fireEvent.click(modalContent);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('General Settings Tab', () => {
    it('should display theme selection', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} />
        </SettingsProvider>
      );

      expect(screen.getByText(/theme/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/light/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/dark/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/system/i)).toBeInTheDocument();
    });

    it('should display auto-save toggle', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} />
        </SettingsProvider>
      );

      expect(screen.getByText(/auto-save/i)).toBeInTheDocument();
      const toggle = screen.getByRole('checkbox', { name: /auto-save/i });
      expect(toggle).toBeInTheDocument();
    });

    it('should display vim mode toggle', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} />
        </SettingsProvider>
      );

      expect(screen.getByText(/vim mode/i)).toBeInTheDocument();
      const toggle = screen.getByRole('checkbox', { name: /vim mode/i });
      expect(toggle).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts Tab', () => {
    it('should display keyboard shortcuts tab', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} />
        </SettingsProvider>
      );

      const shortcutsTab = screen.getByRole('tab', { name: /keyboard shortcuts/i });
      expect(shortcutsTab).toBeInTheDocument();
    });

    it('should display all keyboard shortcuts when tab is clicked', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} />
        </SettingsProvider>
      );

      const shortcutsTab = screen.getByRole('tab', { name: /keyboard shortcuts/i });
      fireEvent.click(shortcutsTab);

      expect(screen.getByText(/save/i)).toBeInTheDocument();
      expect(screen.getByText(/bold/i)).toBeInTheDocument();
      expect(screen.getByText(/italic/i)).toBeInTheDocument();
      expect(screen.getByText(/toggle preview/i)).toBeInTheDocument();
      expect(screen.getByText(/toggle editor/i)).toBeInTheDocument();
    });

    it('should display current shortcut values', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} />
        </SettingsProvider>
      );

      const shortcutsTab = screen.getByRole('tab', { name: /keyboard shortcuts/i });
      fireEvent.click(shortcutsTab);

      // Default shortcuts should be visible
      expect(screen.getByDisplayValue('Mod+s')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Mod+b')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Mod+i')).toBeInTheDocument();
    });

    it('should have reset to defaults button', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} />
        </SettingsProvider>
      );

      const shortcutsTab = screen.getByRole('tab', { name: /keyboard shortcuts/i });
      fireEvent.click(shortcutsTab);

      const resetButton = screen.getByRole('button', { name: /reset to defaults/i });
      expect(resetButton).toBeInTheDocument();
    });
  });

  describe('Settings Persistence', () => {
    it('should toggle auto-save setting', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} />
        </SettingsProvider>
      );

      const autoSaveToggle = screen.getByRole('checkbox', { name: /auto-save/i });
      const initialState = autoSaveToggle.getAttribute('aria-checked') === 'true';

      fireEvent.click(autoSaveToggle);

      // State should have toggled
      expect(autoSaveToggle.getAttribute('aria-checked')).toBe(String(!initialState));
    });

    it('should change theme selection', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} />
        </SettingsProvider>
      );

      const darkTheme = screen.getByLabelText(/dark/i);
      fireEvent.click(darkTheme);

      expect(darkTheme).toBeChecked();
    });

    it('should toggle vim mode', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} />
        </SettingsProvider>
      );

      const vimToggle = screen.getByRole('checkbox', { name: /vim mode/i });
      expect(vimToggle.getAttribute('aria-checked')).toBe('false'); // Default is off

      fireEvent.click(vimToggle);

      expect(vimToggle.getAttribute('aria-checked')).toBe('true');
    });
  });

  describe('Close Button', () => {
    it('should have a close button', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} />
        </SettingsProvider>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      render(
        <SettingsProvider>
          <SettingsModal {...defaultProps} />
        </SettingsProvider>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });
});
