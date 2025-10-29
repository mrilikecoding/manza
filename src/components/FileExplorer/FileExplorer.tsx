import { useState } from 'react';
import { invoke } from '@tauri-apps/api';

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

  const handleFileDoubleClick = (file: FileItem) => {
    if (file.isDirectory && onNavigateInto) {
      onNavigateInto(file.path);
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

    // Render the file/folder item
    elements.push(
      <div
        key={file.path}
        data-testid={`file-item-${file.name}`}
        onClick={() => file.isDirectory ? handleFolderClick(file) : handleFileClick(file)}
        onDoubleClick={() => handleFileDoubleClick(file)}
        style={{ paddingLeft: `${paddingLeft}px` }}
        className={`
          flex cursor-pointer items-center rounded px-3 py-2 text-sm
          transition-colors hover:bg-gray-100 dark:hover:bg-gray-800
          ${file.isDirectory ? 'font-semibold' : ''}
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
      className="h-full w-full overflow-auto bg-white dark:bg-gray-900"
    >
      {/* Breadcrumb and Navigation */}
      {rootPath && (
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center space-x-2">
            {/* Navigate Up Button */}
            <button
              data-testid="navigate-up-button"
              onClick={onNavigateUp}
              disabled={isAtRoot}
              className="rounded p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-800"
              title="Go to parent directory"
            >
              <svg
                className="h-5 w-5 text-gray-600 dark:text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </button>

            {/* Breadcrumb */}
            <div data-testid="breadcrumb" className="flex items-center space-x-1 text-sm">
              {breadcrumbSegments.map((segment, index) => (
                <div key={segment.path} className="flex items-center">
                  {index > 0 && (
                    <span className="mx-1 text-gray-400 dark:text-gray-600">/</span>
                  )}
                  <button
                    onClick={() => onBreadcrumbClick?.(segment.path)}
                    className="rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <span className="text-gray-700 dark:text-gray-300">{segment.name}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      <div className="p-4">
        <div className="space-y-1">
          {sortedFiles.map((file) => renderFileItem(file))}
        </div>
      </div>
    </div>
  );
}
