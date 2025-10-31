import { useState, useEffect, useRef } from 'react';

export interface FileDialogProps {
  title: string;
  placeholder: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function FileDialog({
  title,
  placeholder,
  defaultValue = '',
  onConfirm,
  onCancel,
}: FileDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when dialog opens
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Name cannot be empty');
      return;
    }

    // Check for invalid characters
    if (/[<>:"|?*]/.test(trimmed)) {
      setError('Name contains invalid characters');
      return;
    }

    // Check for path separators
    if (trimmed.includes('/') || trimmed.includes('\\')) {
      setError('Name cannot contain path separators');
      return;
    }

    onConfirm(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      data-testid="file-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
