import { useState, useEffect, useRef } from 'react';

export interface FileContextMenuProps {
  x: number;
  y: number;
  isDirectory: boolean;
  fileName: string;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onNewFileInFolder?: () => void;
  onNewFolderInFolder?: () => void;
}

export function FileContextMenu({
  x,
  y,
  isDirectory,
  fileName,
  onClose,
  onRename,
  onDelete,
  onNewFileInFolder,
  onNewFolderInFolder,
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
      {/* Folder-specific options */}
      {isDirectory && onNewFileInFolder && (
        <button
          onClick={onNewFileInFolder}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          New File in {fileName}
        </button>
      )}
      {isDirectory && onNewFolderInFolder && (
        <button
          onClick={onNewFolderInFolder}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          New Folder in {fileName}
        </button>
      )}

      {/* Separator if folder has special options */}
      {isDirectory && (onNewFileInFolder || onNewFolderInFolder) && (
        <div className="my-1 border-t border-gray-200 dark:border-gray-600" />
      )}

      {/* Standard options */}
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
