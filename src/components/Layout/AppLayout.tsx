import { useState, useCallback, useEffect, useRef } from 'react';
import { open } from '@tauri-apps/api/dialog';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { FileExplorer, type FileItem } from '../FileExplorer';
import { MarkdownEditor } from '../Editor';
import { MarkdownPreview } from '../Preview';
import { ResizablePanes } from './ResizablePanes';
import { useTheme } from '../../contexts/ThemeContext';

// Type from Rust backend (snake_case)
interface BackendFileItem {
  name: string;
  path: string;
  is_directory: boolean;
  is_markdown?: boolean;
}

export function AppLayout() {
  const { theme, setTheme } = useTheme();
  const [rootDirectoryPath, setRootDirectoryPath] = useState<string | null>(null);
  const [currentDirectoryPath, setCurrentDirectoryPath] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [isFileExplorerCollapsed, setIsFileExplorerCollapsed] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [fileExplorerWidth, setFileExplorerWidth] = useState(256); // 256px = 16rem = w-64

  // Navigation history
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [navigationIndex, setNavigationIndex] = useState<number>(-1);

  // File explorer resize
  const isDraggingExplorerRef = useRef(false);

  // Handle file explorer resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingExplorerRef.current) return;

      const newWidth = e.clientX;
      // Enforce min/max constraints (200px to 600px)
      const constrainedWidth = Math.min(Math.max(newWidth, 200), 600);
      setFileExplorerWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      isDraggingExplorerRef.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleExplorerResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingExplorerRef.current = true;
  };

  // Load last directory and file on mount
  useEffect(() => {
    const loadLastDirectory = async () => {
      try {
        const lastDirectory = localStorage.getItem('manza_last_directory');
        if (lastDirectory) {
          // Verify the directory still exists
          const directoryContents = await invoke<BackendFileItem[]>('get_directory_contents', {
            path: lastDirectory,
          });

          // Directory exists, load it
          setRootDirectoryPath(lastDirectory);
          setCurrentDirectoryPath(lastDirectory);
          const transformedFiles: FileItem[] = directoryContents.map(file => ({
            name: file.name,
            path: file.path,
            isDirectory: file.is_directory,
            isMarkdown: file.is_markdown,
          }));
          setFiles(transformedFiles);

          // Add to navigation history
          setNavigationHistory([lastDirectory]);
          setNavigationIndex(0);

          // Start watching the directory
          try {
            await invoke('watch_directory', { path: lastDirectory });
          } catch (err) {
            console.error('[File Watcher] Failed to start file watching:', err);
          }

          // Try to restore last opened file
          const lastFile = localStorage.getItem('manza_last_file');
          if (lastFile) {
            try {
              const fileContent = await invoke<string>('read_file_contents', {
                path: lastFile,
              });
              setSelectedFilePath(lastFile);
              setContent(fileContent);
            } catch (err) {
              // File no longer exists, clear from storage
              console.log('Last file not accessible, clearing from storage');
              localStorage.removeItem('manza_last_file');
            }
          }
        }
      } catch (err) {
        // Directory no longer exists or error loading, clear from storage
        console.log('Last directory not accessible, clearing from storage');
        localStorage.removeItem('manza_last_directory');
        localStorage.removeItem('manza_last_file');
      }
    };

    loadLastDirectory();
  }, []); // Run only once on mount

  // Persist current directory whenever it changes
  useEffect(() => {
    if (currentDirectoryPath) {
      localStorage.setItem('manza_last_directory', currentDirectoryPath);
    }
  }, [currentDirectoryPath]);

  // Persist selected file whenever it changes
  useEffect(() => {
    if (selectedFilePath) {
      localStorage.setItem('manza_last_file', selectedFilePath);
    }
  }, [selectedFilePath]);

  // Listen for file system changes
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      unlisten = await listen('file-change', async (event) => {
        console.log('[File Watcher] Change detected:', event.payload);

        // Refresh the current directory if it's being watched
        if (currentDirectoryPath) {
          console.log('[File Watcher] Refreshing directory:', currentDirectoryPath);
          try {
            const directoryContents = await invoke<BackendFileItem[]>('get_directory_contents', {
              path: currentDirectoryPath,
            });
            console.log('[File Watcher] Got', directoryContents.length, 'items');
            const transformedFiles: FileItem[] = directoryContents.map(file => ({
              name: file.name,
              path: file.path,
              isDirectory: file.is_directory,
              isMarkdown: file.is_markdown,
            }));
            setFiles(transformedFiles);

            // Trigger refresh of expanded folders in FileExplorer
            setRefreshTrigger(prev => prev + 1);

            // If the currently open file was modified, reload it
            if (selectedFilePath) {
              console.log('[File Watcher] Checking if open file changed:', selectedFilePath);
              try {
                const fileContent = await invoke<string>('read_file_contents', {
                  path: selectedFilePath,
                });
                setContent(fileContent);
                console.log('[File Watcher] Reloaded open file');
              } catch (err) {
                // File might have been deleted
                console.error('[File Watcher] Failed to reload file:', err);
              }
            }
          } catch (err) {
            console.error('[File Watcher] Failed to refresh directory:', err);
          }
        } else {
          console.log('[File Watcher] No current directory path, skipping refresh');
        }
      });
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [currentDirectoryPath, selectedFilePath]);

  // Helper to add directory to navigation history
  const addToNavigationHistory = useCallback((path: string) => {
    setNavigationHistory(prev => {
      // If we're in the middle of history (navigated back), clear forward history
      const newHistory = prev.slice(0, navigationIndex + 1);
      // Only add if it's different from the current location
      if (newHistory[newHistory.length - 1] !== path) {
        newHistory.push(path);
        setNavigationIndex(newHistory.length - 1);
        return newHistory;
      }
      return prev;
    });
  }, [navigationIndex]);

  // Navigate backward in history
  const handleNavigateBack = useCallback(async () => {
    if (navigationIndex > 0) {
      const previousIndex = navigationIndex - 1;
      const previousPath = navigationHistory[previousIndex];

      try {
        setCurrentDirectoryPath(previousPath);
        const directoryContents = await invoke<BackendFileItem[]>('get_directory_contents', {
          path: previousPath,
        });
        const transformedFiles: FileItem[] = directoryContents.map(file => ({
          name: file.name,
          path: file.path,
          isDirectory: file.is_directory,
          isMarkdown: file.is_markdown,
        }));
        setFiles(transformedFiles);
        setNavigationIndex(previousIndex);

        // Update file watcher
        try {
          await invoke('watch_directory', { path: previousPath });
        } catch (err) {
          console.error('[File Watcher] Failed to update file watching:', err);
        }
      } catch (err) {
        setError(`Error loading directory: ${err}`);
      }
    }
  }, [navigationIndex, navigationHistory]);

  // Navigate forward in history
  const handleNavigateForward = useCallback(async () => {
    if (navigationIndex < navigationHistory.length - 1) {
      const nextIndex = navigationIndex + 1;
      const nextPath = navigationHistory[nextIndex];

      try {
        setCurrentDirectoryPath(nextPath);
        const directoryContents = await invoke<BackendFileItem[]>('get_directory_contents', {
          path: nextPath,
        });
        const transformedFiles: FileItem[] = directoryContents.map(file => ({
          name: file.name,
          path: file.path,
          isDirectory: file.is_directory,
          isMarkdown: file.is_markdown,
        }));
        setFiles(transformedFiles);
        setNavigationIndex(nextIndex);

        // Update file watcher
        try {
          await invoke('watch_directory', { path: nextPath });
        } catch (err) {
          console.error('[File Watcher] Failed to update file watching:', err);
        }
      } catch (err) {
        setError(`Error loading directory: ${err}`);
      }
    }
  }, [navigationIndex, navigationHistory]);

  const handleSelectDirectory = useCallback(async () => {
    try {
      setError(null);
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === 'string') {
        setRootDirectoryPath(selected);
        setCurrentDirectoryPath(selected);
        const directoryContents = await invoke<BackendFileItem[]>('get_directory_contents', {
          path: selected,
        });
        // Transform snake_case to camelCase
        const transformedFiles: FileItem[] = directoryContents.map(file => ({
          name: file.name,
          path: file.path,
          isDirectory: file.is_directory,
          isMarkdown: file.is_markdown,
        }));
        setFiles(transformedFiles);

        // Add to navigation history
        addToNavigationHistory(selected);

        // Start watching the directory for changes
        try {
          console.log('[File Watcher] Starting watch on:', selected);
          await invoke('watch_directory', { path: selected });
          console.log('[File Watcher] Watch started successfully');
        } catch (err) {
          console.error('[File Watcher] Failed to start file watching:', err);
        }
      }
    } catch (err) {
      setError(`Error loading directory: ${err}`);
    }
  }, [addToNavigationHistory]);

  const handleFileSelect = useCallback(async (filePath: string) => {
    // Find the file in our files array to check if it's a directory
    const file = files.find(f => f.path === filePath);
    if (file && file.isDirectory) {
      return;
    }

    try {
      setError(null);
      const fileContent = await invoke<string>('read_file_contents', {
        path: filePath,
      });
      setSelectedFilePath(filePath);
      setContent(fileContent);
    } catch (err) {
      setError(`Error loading file: ${err}`);
    }
  }, [files]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedFilePath) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await invoke('save_file_contents', {
        path: selectedFilePath,
        content,
      });
    } catch (err) {
      setError(`Error saving file: ${err}`);
    } finally {
      setIsSaving(false);
    }
  }, [selectedFilePath, content]);

  const handleFolderExpand = useCallback(async (folderPath: string): Promise<FileItem[]> => {
    try {
      setError(null);
      const directoryContents = await invoke<BackendFileItem[]>('get_directory_contents', {
        path: folderPath,
      });
      // Transform snake_case to camelCase
      const transformedFiles: FileItem[] = directoryContents.map(file => ({
        name: file.name,
        path: file.path,
        isDirectory: file.is_directory,
        isMarkdown: file.is_markdown,
      }));
      return transformedFiles;
    } catch (err) {
      setError(`Error loading directory: ${err}`);
      return [];
    }
  }, []);

  const handleNavigateInto = useCallback(async (folderPath: string) => {
    try {
      setError(null);
      setCurrentDirectoryPath(folderPath);
      const directoryContents = await invoke<BackendFileItem[]>('get_directory_contents', {
        path: folderPath,
      });
      const transformedFiles: FileItem[] = directoryContents.map(file => ({
        name: file.name,
        path: file.path,
        isDirectory: file.is_directory,
        isMarkdown: file.is_markdown,
      }));
      setFiles(transformedFiles);

      // Add to navigation history
      addToNavigationHistory(folderPath);

      // Update file watcher to watch the new directory
      try {
        console.log('[File Watcher] Updating watch to:', folderPath);
        await invoke('watch_directory', { path: folderPath });
        console.log('[File Watcher] Watch updated successfully');
      } catch (err) {
        console.error('[File Watcher] Failed to update file watching:', err);
      }
    } catch (err) {
      setError(`Error loading directory: ${err}`);
    }
  }, [addToNavigationHistory]);

  const handleNavigateUp = useCallback(async () => {
    if (!currentDirectoryPath) return;

    try {
      setError(null);
      // Get parent directory path
      const segments = currentDirectoryPath.split('/').filter(Boolean);
      if (segments.length === 0) return;

      const parentPath = '/' + segments.slice(0, -1).join('/');
      setCurrentDirectoryPath(parentPath);

      const directoryContents = await invoke<BackendFileItem[]>('get_directory_contents', {
        path: parentPath,
      });
      const transformedFiles: FileItem[] = directoryContents.map(file => ({
        name: file.name,
        path: file.path,
        isDirectory: file.is_directory,
        isMarkdown: file.is_markdown,
      }));
      setFiles(transformedFiles);

      // Add to navigation history
      addToNavigationHistory(parentPath);

      // Update file watcher to watch the parent directory
      try {
        console.log('[File Watcher] Updating watch to parent:', parentPath);
        await invoke('watch_directory', { path: parentPath });
        console.log('[File Watcher] Watch updated successfully');
      } catch (err) {
        console.error('[File Watcher] Failed to update file watching:', err);
      }
    } catch (err) {
      setError(`Error loading directory: ${err}`);
    }
  }, [currentDirectoryPath, addToNavigationHistory]);

  const handleBreadcrumbClick = useCallback(async (path: string) => {
    try {
      setError(null);
      setCurrentDirectoryPath(path);
      const directoryContents = await invoke<BackendFileItem[]>('get_directory_contents', {
        path,
      });
      const transformedFiles: FileItem[] = directoryContents.map(file => ({
        name: file.name,
        path: file.path,
        isDirectory: file.is_directory,
        isMarkdown: file.is_markdown,
      }));
      setFiles(transformedFiles);

      // Add to navigation history
      addToNavigationHistory(path);

      // Update file watcher to watch the breadcrumb path
      try {
        console.log('[File Watcher] Updating watch to breadcrumb path:', path);
        await invoke('watch_directory', { path });
        console.log('[File Watcher] Watch updated successfully');
      } catch (err) {
        console.error('[File Watcher] Failed to update file watching:', err);
      }
    } catch (err) {
      setError(`Error loading directory: ${err}`);
    }
  }, [addToNavigationHistory]);

  const handleRefresh = useCallback(async () => {
    if (!currentDirectoryPath) return;

    try {
      setError(null);
      const directoryContents = await invoke<BackendFileItem[]>('get_directory_contents', {
        path: currentDirectoryPath,
      });
      const transformedFiles: FileItem[] = directoryContents.map(file => ({
        name: file.name,
        path: file.path,
        isDirectory: file.is_directory,
        isMarkdown: file.is_markdown,
      }));
      setFiles(transformedFiles);
    } catch (err) {
      setError(`Error refreshing directory: ${err}`);
    }
  }, [currentDirectoryPath]);

  const isAtRoot = currentDirectoryPath === rootDirectoryPath;

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

  const handleCollapseEditor = useCallback(() => {
    setIsEditorCollapsed(!isEditorCollapsed);
  }, [isEditorCollapsed]);

  const handleCollapsePreview = useCallback(() => {
    setIsPreviewCollapsed(!isPreviewCollapsed);
  }, [isPreviewCollapsed]);

  const handleToggleFileExplorer = useCallback(() => {
    setIsFileExplorerCollapsed(!isFileExplorerCollapsed);
  }, [isFileExplorerCollapsed]);

  const breadcrumbSegments = parseBreadcrumb(currentDirectoryPath);

  return (
    <div
      data-testid="app-layout"
      className="flex h-screen w-screen flex-col overflow-hidden bg-gray-100 dark:bg-gray-800"
    >
      {/* Breadcrumb Navigation Bar */}
      {currentDirectoryPath && (
        <div className="flex-shrink-0 border-b border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center space-x-2">
            {/* Back Button */}
            <button
              data-testid="navigate-back-button"
              onClick={handleNavigateBack}
              disabled={navigationIndex <= 0}
              className="rounded p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-800"
              title="Navigate back"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Forward Button */}
            <button
              data-testid="navigate-forward-button"
              onClick={handleNavigateForward}
              disabled={navigationIndex >= navigationHistory.length - 1}
              className="rounded p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-800"
              title="Navigate forward"
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Navigate Up Button */}
            <button
              data-testid="navigate-up-button"
              onClick={handleNavigateUp}
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

            {/* Select Directory Button */}
            <button
              data-testid="select-directory-button"
              onClick={handleSelectDirectory}
              className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Select directory"
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
                  d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                />
              </svg>
            </button>

            {/* Breadcrumb */}
            <div data-testid="breadcrumb" className="flex flex-1 items-center space-x-1 text-sm">
              {breadcrumbSegments.map((segment, index) => (
                <div key={segment.path} className="flex items-center">
                  {index > 0 && (
                    <span className="mx-1 text-gray-400 dark:text-gray-600">/</span>
                  )}
                  <button
                    onClick={() => handleBreadcrumbClick(segment.path)}
                    className="rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <span className="text-gray-700 dark:text-gray-300">{segment.name}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* View Controls */}
            <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 dark:border-gray-700">
              {/* Toggle File Explorer */}
              <button
                data-testid="toggle-file-explorer-button"
                onClick={handleToggleFileExplorer}
                className={`rounded p-1 ${
                  !isFileExplorerCollapsed
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
                title={isFileExplorerCollapsed ? "Show file explorer" : "Hide file explorer"}
              >
                <svg
                  className="h-5 w-5"
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
              </button>

              {/* Toggle Editor */}
              <button
                data-testid="toggle-editor-button"
                onClick={handleCollapseEditor}
                disabled={isPreviewCollapsed}
                className={`rounded p-1 ${
                  !isEditorCollapsed
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                } ${isPreviewCollapsed ? 'cursor-not-allowed opacity-50' : ''}`}
                title={isEditorCollapsed ? "Show editor" : isPreviewCollapsed ? "Editor (only pane open)" : "Hide editor"}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </button>

              {/* Toggle Preview */}
              <button
                data-testid="toggle-preview-button"
                onClick={handleCollapsePreview}
                disabled={isEditorCollapsed}
                className={`rounded p-1 ${
                  !isPreviewCollapsed
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                } ${isEditorCollapsed ? 'cursor-not-allowed opacity-50' : ''}`}
                title={isPreviewCollapsed ? "Show preview" : isEditorCollapsed ? "Preview (only pane open)" : "Hide preview"}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              data-testid="theme-toggle"
              onClick={() => {
                const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
                setTheme(nextTheme);
              }}
              className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              title={`Current theme: ${theme} (click to cycle)`}
            >
              {theme === 'light' && (
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
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              )}
              {theme === 'dark' && (
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
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
              {theme === 'system' && (
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
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
      {/* File Explorer Column */}
      {!isFileExplorerCollapsed && (
        <>
        <div
          data-testid="file-explorer-column"
          className="flex h-full flex-col bg-white dark:bg-gray-900"
          style={{ width: `${fileExplorerWidth}px`, minWidth: '200px', maxWidth: '600px' }}
        >
          <div className="flex-1 overflow-auto">
            <FileExplorer
              rootPath={currentDirectoryPath}
              files={files}
              onFileSelect={handleFileSelect}
              onFolderExpand={handleFolderExpand}
              onNavigateUp={handleNavigateUp}
              onNavigateInto={handleNavigateInto}
              onBreadcrumbClick={handleBreadcrumbClick}
              onRefresh={handleRefresh}
              isAtRoot={isAtRoot}
              showDirectoryButton={false}
              refreshTrigger={refreshTrigger}
              onNavigateBack={handleNavigateBack}
              onNavigateForward={handleNavigateForward}
              canNavigateBack={navigationIndex > 0}
              canNavigateForward={navigationIndex < navigationHistory.length - 1}
            />
          </div>
        </div>
        {/* File Explorer Resize Divider */}
        <div
          data-testid="explorer-divider"
          draggable="true"
          onMouseDown={handleExplorerResizeStart}
          className="w-1 cursor-col-resize bg-gray-300 hover:bg-blue-500 dark:bg-gray-700 dark:hover:bg-blue-600"
        />
        </>
      )}

      {/* Resizable Editor and Preview Panes */}
      <ResizablePanes
        isLeftCollapsed={isEditorCollapsed}
        isRightCollapsed={isPreviewCollapsed}
        onCollapseLeft={handleCollapseEditor}
        onCollapseRight={handleCollapsePreview}
        leftContent={
          <div
            data-testid="editor-column"
            className="flex h-full flex-col border-r border-gray-300 dark:border-gray-700"
          >
            {error && (
              <div className="border-b border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-200">
                {error}
              </div>
            )}
            <div className="flex-1">
              <MarkdownEditor
                key={selectedFilePath}
                content={content}
                onChange={handleContentChange}
                onSave={handleSave}
                filePath={selectedFilePath}
                isSaving={isSaving}
              />
            </div>
          </div>
        }
        rightContent={
          <div
            data-testid="preview-column"
            className="flex h-full flex-col bg-white dark:bg-gray-900"
          >
            <MarkdownPreview content={content} />
          </div>
        }
      />
      </div>
    </div>
  );
}
