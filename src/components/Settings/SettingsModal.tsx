import { useState, useEffect } from 'react';
import { useSettings, type KeyboardShortcuts } from '../../contexts/SettingsContext';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'general' | 'shortcuts';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetShortcuts } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('general');

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
  };

  const handleAutoSaveToggle = () => {
    updateSettings({ autoSave: !settings.autoSave });
  };

  const handleVimModeToggle = () => {
    updateSettings({ vimMode: !settings.vimMode });
  };

  const handleResetShortcuts = () => {
    resetShortcuts();
  };

  return (
    <div
      data-testid="modal-backdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6">
          <h2 id="settings-title" className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              role="tab"
              aria-selected={activeTab === 'general'}
              onClick={() => setActiveTab('general')}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              General
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'shortcuts'}
              onClick={() => setActiveTab('shortcuts')}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'shortcuts'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Keyboard Shortcuts
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Theme Selection */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Theme
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={settings.theme === 'light'}
                      onChange={() => handleThemeChange('light')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">Light</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={settings.theme === 'dark'}
                      onChange={() => handleThemeChange('dark')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">Dark</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="theme"
                      value="system"
                      checked={settings.theme === 'system'}
                      onChange={() => handleThemeChange('system')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">System</span>
                  </label>
                </div>
              </div>

              {/* Auto-save Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="auto-save" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-save
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Automatically save changes after 2 seconds of inactivity
                  </p>
                </div>
                <button
                  id="auto-save"
                  role="checkbox"
                  aria-checked={settings.autoSave}
                  aria-label="Auto-save"
                  onClick={handleAutoSaveToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoSave ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Vim Mode Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="vim-mode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Vim Mode
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enable Vim keybindings in the editor
                  </p>
                </div>
                <button
                  id="vim-mode"
                  role="checkbox"
                  aria-checked={settings.vimMode}
                  aria-label="Vim mode"
                  onClick={handleVimModeToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.vimMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.vimMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <div className="space-y-3">
                {Object.entries(settings.keyboardShortcuts).map(([action, shortcut]) => (
                  <div key={action} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                      {action.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <input
                      type="text"
                      value={shortcut}
                      readOnly
                      className="w-32 rounded border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleResetShortcuts}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
