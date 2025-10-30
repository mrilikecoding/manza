import { useState, useEffect, useRef } from 'react';

export interface FileContextMenuProps {
  x: number;
  y: number;
  isDirectory: boolean;
  fileName: string;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function FileContextMenu({
  x,
  y,
  isDirectory,
  fileName,
  onClose,
  onRename,
  onDelete,
}: FileContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      data-testid="file-context-menu"
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg py-1 min-w-[160px]"
      style={{ top: y, left: x }}
    >
      <button
        onClick={onRename}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
      >
        Rename {isDirectory ? 'Folder' : 'File'}
      </button>
      <button
        onClick={onDelete}
        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
      >
        Delete {isDirectory ? 'Folder' : 'File'}
      </button>
    </div>
  );
}
