import { useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api';
import { FileContextMenu } from './FileContextMenu';
import { FileDialog } from './FileDialog';
import { ConfirmDialog } from './ConfirmDialog';

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isMarkdown?: boolean;
  expanded?: boolean;
  children?: FileItem[];
  depth?: number;
}

export interface FileExplorerProps {
  rootPath?: string | null;
  files?: FileItem[];
  onFileSelect: (path: string) => void;
  onFolderExpand?: (path: string) => Promise<FileItem[]>;
  onNavigateUp?: () => void;
  onNavigateInto?: (path: string) => void;
  onBreadcrumbClick?: (path: string) => void;
  onRefresh?: () => void;
  isAtRoot?: boolean;
  showDirectoryButton?: boolean;
}

export function FileExplorer({
  rootPath,
  files = [],
  onFileSelect,
  onFolderExpand,
  onNavigateUp,
  onNavigateInto,
  onBreadcrumbClick,
  onRefresh,
  isAtRoot = true,
  showDirectoryButton = true,
}: FileExplorerProps) {
  // Track which files are currently expanded
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(() => {
    // Initialize with files that have expanded: true
    const initialSet = new Set<string>();
    files.forEach(file => {
      if (file.expanded) {
        initialSet.add(file.path);
      }
    });
    return initialSet;
  });

  // Cache loaded children to avoid re-fetching
  const [childrenCache, setChildrenCache] = useState<Map<string, FileItem[]>>(() => {
    // Initialize cache with files that have children in props
    const initialMap = new Map<string, FileItem[]>();
    files.forEach(file => {
      if (file.children) {
        initialMap.set(file.path, file.children);
      }
    });
    return initialMap;
  });

  // State for context menu and dialogs
  type DialogType = 'create-file' | 'create-folder' | 'rename' | 'delete' | null;
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem } | null>(null);
  const [targetFile, setTargetFile] = useState<FileItem | null>(null);
  const [targetFolder, setTargetFolder] = useState<FileItem | null>(null); // For creating files/folders inside a specific folder

  // Click handling with delay to distinguish single from double clicks
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [clickedFile, setClickedFile] = useState<FileItem | null>(null);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<FileItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null); // path of folder being dragged over

  // Helper function to reload an expanded folder's contents
  const reloadExpandedFolder = async (folderPath: string) => {
    if (!expandedFiles.has(folderPath)) {
      // Folder not expanded, no need to reload
      return;
    }

    if (!onFolderExpand) {
      return;
    }

    try {
      const children = await onFolderExpand(folderPath);
      const newCache = new Map(childrenCache);
      newCache.set(folderPath, children);
      setChildrenCache(newCache);
    } catch (error) {
      console.error('Failed to reload expanded folder:', error);
    }
  };

  const handleFolderClick = async (folder: FileItem) => {
    if (!folder.isDirectory) {
      return;
    }

    // Check if currently expanded
    const isExpanded = expandedFiles.has(folder.path);

    if (isExpanded) {
      // Collapse: remove from expanded set (keep cache)
      const newExpanded = new Set(expandedFiles);
      newExpanded.delete(folder.path);
      setExpandedFiles(newExpanded);
    } else {
      // Expand: check cache first, then props, then load
      let childrenToUse: FileItem[] | undefined;

      if (childrenCache.has(folder.path)) {
        // Use cached children
        childrenToUse = childrenCache.get(folder.path);
      } else if (folder.children && folder.children.length > 0) {
        // Use children from props
        childrenToUse = folder.children;
        // Add to cache
        const newCache = new Map(childrenCache);
        newCache.set(folder.path, folder.children);
        setChildrenCache(newCache);
      } else if (onFolderExpand) {
        // Load children from parent component
        try {
          childrenToUse = await onFolderExpand(folder.path);
          // Add to cache
          const newCache = new Map(childrenCache);
          newCache.set(folder.path, childrenToUse);
          setChildrenCache(newCache);
        } catch (error) {
          console.error('Failed to expand folder:', error);
          return;
        }
      }

      if (childrenToUse) {
        const newExpanded = new Set(expandedFiles);
        newExpanded.add(folder.path);
        setExpandedFiles(newExpanded);
      }
    }
  };

  const handleSelectDirectory = async () => {
    try {
      const result = await invoke<string | null>('select_directory');
      if (result) {
        // Directory selected, parent component should handle this
        console.log('Selected directory:', result);
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
    }
  };

  const handleFileClick = (file: FileItem) => {
    if (!file.isDirectory) {
      onFileSelect(file.path);
    }
  };

  const handleItemClick = (file: FileItem) => {
    // Clear any pending single-click action
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    // Delay single-click action to wait for potential double-click
    clickTimeoutRef.current = setTimeout(() => {
      if (file.isDirectory) {
        handleFolderClick(file);
      } else {
        handleFileClick(file);
      }
      clickTimeoutRef.current = null;
    }, 250); // 250ms delay
  };

  const handleItemDoubleClick = (file: FileItem) => {
    // Clear the pending single-click action
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    // Navigate into directory on double-click
    if (file.isDirectory && onNavigateInto) {
      onNavigateInto(file.path);
    }
  };

  // File operation handlers
  const handleCreateFile = async (filename: string) => {
    try {
      // If targetFolder is set, create in that folder, otherwise create in current directory
      const basePath = targetFolder ? targetFolder.path : rootPath;
      const newPath = basePath ? `${basePath}/${filename}` : filename;
      await invoke('create_new_file', { path: newPath });
      setActiveDialog(null);
      setTargetFolder(null);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleCreateFolder = async (foldername: string) => {
    try {
      // If targetFolder is set, create in that folder, otherwise create in current directory
      const basePath = targetFolder ? targetFolder.path : rootPath;
      const newPath = basePath ? `${basePath}/${foldername}` : foldername;
      await invoke('create_new_directory', { path: newPath });
      setActiveDialog(null);
      setTargetFolder(null);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleRename = async (newName: string) => {
    if (!targetFile) return;

    try {
      const parentPath = targetFile.path.substring(0, targetFile.path.lastIndexOf('/'));
      const newPath = `${parentPath}/${newName}`;
      await invoke('rename_file_or_directory', { oldPath: targetFile.path, newPath });
      setActiveDialog(null);
      setTargetFile(null);
      setContextMenu(null);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to rename:', error);
    }
  };

  const handleDelete = async () => {
    if (!targetFile) return;

    try {
      if (targetFile.isDirectory) {
        await invoke('delete_directory_at_path', { path: targetFile.path });
      } else {
        await invoke('delete_file_at_path', { path: targetFile.path });
      }
      setActiveDialog(null);
      setTargetFile(null);
      setContextMenu(null);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleContextMenuRename = () => {
    if (!contextMenu) return;
    setTargetFile(contextMenu.file);
    setActiveDialog('rename');
    setContextMenu(null);
  };

  const handleContextMenuDelete = () => {
    if (!contextMenu) return;
    setTargetFile(contextMenu.file);
    setActiveDialog('delete');
    setContextMenu(null);
  };

  const handleContextMenuNewFileInFolder = () => {
    if (!contextMenu || !contextMenu.file.isDirectory) return;
    setTargetFolder(contextMenu.file);
    setActiveDialog('create-file');
    setContextMenu(null);
  };

  const handleContextMenuNewFolderInFolder = () => {
    if (!contextMenu || !contextMenu.file.isDirectory) return;
    setTargetFolder(contextMenu.file);
    setActiveDialog('create-folder');
    setContextMenu(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, file: FileItem) => {
    e.stopPropagation();
    setDraggedItem(file);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.path);
  };

  const handleDragOver = (e: React.DragEvent, file: FileItem) => {
    // Always prevent default to enable drop
    e.preventDefault();

    // Only allow drop on folders, not files
    if (!file.isDirectory) {
      e.dataTransfer.dropEffect = 'none';
      // Don't stop propagation - let it bubble to root
      return;
    }

    // Don't allow dropping on itself
    if (draggedItem && draggedItem.path === file.path) {
      e.dataTransfer.dropEffect = 'none';
      // Don't stop propagation
      return;
    }

    // For folders, stop propagation so root handler doesn't interfere
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(file.path);
  };

  const handleDragLeave = (e: React.DragEvent, file: FileItem) => {
    e.stopPropagation();
    // Only clear if we're actually leaving this element (not entering a child)
    if (e.currentTarget === e.target) {
      setDropTarget(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetFolder: FileItem) => {
    // If dropping on a non-folder, let it bubble up to the root handler
    if (!targetFolder.isDirectory) {
      setDropTarget(null);
      return; // Don't prevent default - let it bubble
    }

    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);

    if (!draggedItem) {
      return;
    }

    // Don't allow dropping on itself
    if (draggedItem.path === targetFolder.path) {
      return;
    }

    try {
      // Get the filename from the dragged item path
      const fileName = draggedItem.path.substring(draggedItem.path.lastIndexOf('/') + 1);
      const newPath = `${targetFolder.path}/${fileName}`;

      // Use the rename command to move the file/folder
      await invoke('rename_file_or_directory', {
        oldPath: draggedItem.path,
        newPath: newPath,
      });

      // Refresh the file list
      onRefresh?.();
      setDraggedItem(null);
    } catch (error) {
      console.error('Failed to move item:', error);
    }
  };

  const handleDragEnd = async (e: React.DragEvent) => {
    // If we have a dropTarget set but drop event never fired, manually trigger the move
    if (dropTarget && draggedItem) {
      if (dropTarget === '__root__') {
        // Move to root
        if (!rootPath) {
          setDraggedItem(null);
          setDropTarget(null);
          return;
        }

        const parentPath = draggedItem.path.substring(0, draggedItem.path.lastIndexOf('/'));
        if (parentPath === rootPath) {
          setDraggedItem(null);
          setDropTarget(null);
          return;
        }

        try {
          const fileName = draggedItem.path.substring(draggedItem.path.lastIndexOf('/') + 1);
          const newPath = `${rootPath}/${fileName}`;

          await invoke('rename_file_or_directory', {
            oldPath: draggedItem.path,
            newPath: newPath,
          });

          // Reload all expanded folders to show updated contents
          const sourceFolder = draggedItem.path.substring(0, draggedItem.path.lastIndexOf('/'));
          await reloadExpandedFolder(sourceFolder);

          // Also refresh the current directory
          onRefresh?.();
        } catch (error) {
          console.error('Failed to move item to root:', error);
        }
      } else {
        // Move to folder
        const targetFolder = files.find(f => f.path === dropTarget);
        if (!targetFolder || !targetFolder.isDirectory) {
          setDraggedItem(null);
          setDropTarget(null);
          return;
        }

        try {
          const fileName = draggedItem.path.substring(draggedItem.path.lastIndexOf('/') + 1);
          const newPath = `${targetFolder.path}/${fileName}`;

          await invoke('rename_file_or_directory', {
            oldPath: draggedItem.path,
            newPath: newPath,
          });

          // Reload both source and destination folders if they're expanded
          const sourceFolder = draggedItem.path.substring(0, draggedItem.path.lastIndexOf('/'));
          await reloadExpandedFolder(sourceFolder);
          await reloadExpandedFolder(targetFolder.path);

          // Also refresh the current directory
          onRefresh?.();
        } catch (error) {
          console.error('Failed to move item:', error);
        }
      }
    }

    setDraggedItem(null);
    setDropTarget(null);
  };

  // Drop on root directory (file list background)
  const handleDropOnRoot = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);

    if (!draggedItem || !rootPath) {
      return;
    }

    // Check if the item is already in the root (parent path matches rootPath)
    const parentPath = draggedItem.path.substring(0, draggedItem.path.lastIndexOf('/'));
    if (parentPath === rootPath) {
      return;
    }

    try {
      const fileName = draggedItem.path.substring(draggedItem.path.lastIndexOf('/') + 1);
      const newPath = `${rootPath}/${fileName}`;

      await invoke('rename_file_or_directory', {
        oldPath: draggedItem.path,
        newPath: newPath,
      });

      onRefresh?.();
      setDraggedItem(null);
    } catch (error) {
      console.error('Failed to move item to root:', error);
    }
  };

  const handleDragOverRoot = (e: React.DragEvent) => {
    if (!draggedItem) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget('__root__');
  };

  const handleDragLeaveRoot = (e: React.DragEvent) => {
    // Only clear if leaving the container itself
    if (e.currentTarget === e.target) {
      setDropTarget(null);
    }
  };

  const parseBreadcrumb = (path: string | null): { name: string; path: string }[] => {
    if (!path) return [];

    const segments = path.split('/').filter(Boolean);
    const breadcrumb: { name: string; path: string }[] = [];

    segments.forEach((segment, index) => {
      const segmentPath = '/' + segments.slice(0, index + 1).join('/');
      breadcrumb.push({ name: segment, path: segmentPath });
    });

    return breadcrumb;
  };

  const isMarkdownFile = (filename: string): boolean => {
    const lower = filename.toLowerCase();
    return lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.mdown');
  };

  // Sort files: directories first, then alphabetically
  const sortedFiles = [...files].sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) {
      return -1;
    }
    if (!a.isDirectory && b.isDirectory) {
      return 1;
    }
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });

  if (!rootPath && files.length === 0) {
    return (
      <div
        data-testid="file-explorer"
        className="flex h-full w-full flex-col items-center justify-center bg-gray-50 p-8 dark:bg-gray-800"
      >
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            Open a directory to get started
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Select a folder containing your markdown files
          </p>
          {showDirectoryButton && (
            <button
              onClick={handleSelectDirectory}
              className="mt-6 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              Select Directory
            </button>
          )}
        </div>
      </div>
    );
  }

  // Recursive function to render a file or folder with its children
  const renderFileItem = (file: FileItem, depth: number = 0): JSX.Element[] => {
    const isMarkdown = !file.isDirectory && isMarkdownFile(file.name);
    const isExpanded = expandedFiles.has(file.path);
    const children = childrenCache.get(file.path) || [];
    const paddingLeft = depth * 20; // 20px per level

    const elements: JSX.Element[] = [];

    // Check if this folder is a drop target
    const isDropTarget = dropTarget === file.path;

    // Render the file/folder item
    elements.push(
      <div
        key={file.path}
        data-testid={`file-item-${file.name}`}
        draggable
        onClick={() => handleItemClick(file)}
        onDoubleClick={() => handleItemDoubleClick(file)}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, file });
        }}
        onDragStart={(e) => handleDragStart(e, file)}
        onDragOver={(e) => handleDragOver(e, file)}
        onDragLeave={(e) => handleDragLeave(e, file)}
        onDrop={(e) => handleDrop(e, file)}
        onDragEnd={handleDragEnd}
        style={{ paddingLeft: `${paddingLeft}px` }}
        className={`
          flex cursor-pointer items-center rounded px-3 py-2 text-sm
          transition-colors hover:bg-gray-100 dark:hover:bg-gray-800
          ${file.isDirectory ? 'font-semibold' : ''}
          ${isDropTarget ? 'bg-blue-50 dark:bg-blue-900 border-2 border-blue-400 dark:border-blue-600' : ''}
        `}
      >
        {/* Chevron for folders */}
        {file.isDirectory && (
          <svg
            data-testid={isExpanded ? 'chevron-down' : 'chevron-right'}
            className={`mr-1 h-3 w-3 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        )}

        {/* Folder or File icon */}
        {file.isDirectory ? (
          <svg
            className="mr-2 h-4 w-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        ) : (
          <svg
            className="ml-4 mr-2 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        )}

        <span
          className={`
            ${isMarkdown ? 'markdown-file font-medium text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
          `}
        >
          {file.name}
        </span>
      </div>
    );

    // Render children if expanded
    if (isExpanded && children.length > 0) {
      children.forEach(child => {
        elements.push(...renderFileItem(child, depth + 1));
      });
    }

    return elements;
  };

  const breadcrumbSegments = parseBreadcrumb(rootPath);

  return (
    <div
      data-testid="file-explorer"
      className="flex h-full w-full flex-col bg-white dark:bg-gray-900"
    >
      {/* Toolbar for New File/Folder */}
      {rootPath && (
        <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            <button
              data-testid="new-file-button"
              onClick={() => setActiveDialog('create-file')}
              className="flex items-center space-x-1 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
              title="New File"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>New File</span>
            </button>
            <button
              data-testid="new-folder-button"
              onClick={() => setActiveDialog('create-folder')}
              className="flex items-center space-x-1 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
              title="New Folder"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <span>New Folder</span>
            </button>
          </div>
        </div>
      )}

      {/* File List */}
      <div
        className={`flex-1 overflow-auto p-4 ${dropTarget === '__root__' ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
        onDragOver={handleDragOverRoot}
        onDragLeave={handleDragLeaveRoot}
        onDrop={handleDropOnRoot}
      >
        <div
          className="space-y-1 min-h-full"
          onDragOver={handleDragOverRoot}
          onDrop={handleDropOnRoot}
        >
          {sortedFiles.map((file) => renderFileItem(file))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isDirectory={contextMenu.file.isDirectory}
          fileName={contextMenu.file.name}
          onClose={() => setContextMenu(null)}
          onRename={handleContextMenuRename}
          onDelete={handleContextMenuDelete}
          onNewFileInFolder={contextMenu.file.isDirectory ? handleContextMenuNewFileInFolder : undefined}
          onNewFolderInFolder={contextMenu.file.isDirectory ? handleContextMenuNewFolderInFolder : undefined}
        />
      )}

      {/* Create File Dialog */}
      {activeDialog === 'create-file' && (
        <FileDialog
          title={targetFolder ? `Create New File in ${targetFolder.name}` : 'Create New File'}
          placeholder="Enter file name (e.g., document.md)"
          onConfirm={handleCreateFile}
          onCancel={() => {
            setActiveDialog(null);
            setTargetFolder(null);
          }}
        />
      )}

      {/* Create Folder Dialog */}
      {activeDialog === 'create-folder' && (
        <FileDialog
          title={targetFolder ? `Create New Folder in ${targetFolder.name}` : 'Create New Folder'}
          placeholder="Enter folder name"
          onConfirm={handleCreateFolder}
          onCancel={() => {
            setActiveDialog(null);
            setTargetFolder(null);
          }}
        />
      )}

      {/* Rename Dialog */}
      {activeDialog === 'rename' && targetFile && (
        <FileDialog
          title={`Rename ${targetFile.isDirectory ? 'Folder' : 'File'}`}
          placeholder="Enter new name"
          defaultValue={targetFile.name}
          onConfirm={handleRename}
          onCancel={() => {
            setActiveDialog(null);
            setTargetFile(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {activeDialog === 'delete' && targetFile && (
        <ConfirmDialog
          title={`Delete ${targetFile.isDirectory ? 'Folder' : 'File'}`}
          message={`Are you sure you want to delete "${targetFile.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={handleDelete}
          onCancel={() => {
            setActiveDialog(null);
            setTargetFile(null);
          }}
        />
      )}
    </div>
  );
}
