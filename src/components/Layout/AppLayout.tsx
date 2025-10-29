import { useState, useCallback } from 'react';
import { open } from '@tauri-apps/api/dialog';
import { invoke } from '@tauri-apps/api/tauri';
import { FileExplorer, type FileItem } from '../FileExplorer';
import { MarkdownEditor } from '../Editor';
import { MarkdownPreview } from '../Preview';
import { ResizablePanes } from './ResizablePanes';

// Type from Rust backend (snake_case)
interface BackendFileItem {
  name: string;
  path: string;
  is_directory: boolean;
  is_markdown?: boolean;
}

export function AppLayout() {
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
      }
    } catch (err) {
      setError(`Error loading directory: ${err}`);
    }
  }, []);

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
    } catch (err) {
      setError(`Error loading directory: ${err}`);
    }
  }, []);

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
    } catch (err) {
      setError(`Error loading directory: ${err}`);
    }
  }, [currentDirectoryPath]);

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
    } catch (err) {
      setError(`Error loading directory: ${err}`);
    }
  }, []);

  const isAtRoot = currentDirectoryPath === rootDirectoryPath;

  const handleCollapseEditor = useCallback(() => {
    setIsEditorCollapsed(!isEditorCollapsed);
  }, [isEditorCollapsed]);

  const handleCollapsePreview = useCallback(() => {
    setIsPreviewCollapsed(!isPreviewCollapsed);
  }, [isPreviewCollapsed]);

  const handleToggleFileExplorer = useCallback(() => {
    setIsFileExplorerCollapsed(!isFileExplorerCollapsed);
  }, [isFileExplorerCollapsed]);

  return (
    <div
      data-testid="app-layout"
      className="flex h-screen w-screen overflow-hidden bg-gray-100 dark:bg-gray-800"
    >
      {/* File Explorer Column */}
      {!isFileExplorerCollapsed && (
        <div
          data-testid="file-explorer-column"
          className="flex h-full w-64 flex-col border-r border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="flex items-center justify-between border-b border-gray-300 p-2 dark:border-gray-700">
            <button
              onClick={handleSelectDirectory}
              className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Select Directory
            </button>
            <button
              onClick={handleToggleFileExplorer}
              className="ml-2 rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Collapse file explorer"
            >
              <svg
                className="h-4 w-4 text-gray-600 dark:text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <FileExplorer
              rootPath={currentDirectoryPath}
              files={files}
              onFileSelect={handleFileSelect}
              onFolderExpand={handleFolderExpand}
              onNavigateUp={handleNavigateUp}
              onNavigateInto={handleNavigateInto}
              onBreadcrumbClick={handleBreadcrumbClick}
              isAtRoot={isAtRoot}
              showDirectoryButton={false}
            />
          </div>
        </div>
      )}

      {/* Expand File Explorer Button (shown when collapsed) */}
      {isFileExplorerCollapsed && (
        <div className="flex items-center border-r border-gray-300 dark:border-gray-700">
          <button
            onClick={handleToggleFileExplorer}
            className="rounded-r bg-gray-200 p-2 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            title="Expand file explorer"
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
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
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
            {selectedFilePath && (
              <div className="border-b border-gray-300 bg-gray-50 p-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <span className="truncate font-mono">{selectedFilePath}</span>
                  {isSaving && (
                    <span className="ml-2 text-xs text-gray-500">Saving...</span>
                  )}
                </div>
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <MarkdownEditor
                key={selectedFilePath}
                content={content}
                onChange={handleContentChange}
                onSave={handleSave}
                filePath={selectedFilePath}
              />
            </div>
          </div>
        }
        rightContent={
          <div
            data-testid="preview-column"
            className="flex h-full flex-col overflow-hidden bg-white dark:bg-gray-900"
          >
            <div className="border-b border-gray-300 bg-gray-50 p-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              Preview
            </div>
            <div className="flex-1 overflow-auto">
              <MarkdownPreview content={content} />
            </div>
          </div>
        }
      />
    </div>
  );
}
