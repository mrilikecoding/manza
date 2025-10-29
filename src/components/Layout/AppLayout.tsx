import { useState, useCallback } from 'react';
import { open } from '@tauri-apps/api/dialog';
import { invoke } from '@tauri-apps/api/tauri';
import { FileExplorer, type FileItem } from '../FileExplorer';
import { MarkdownEditor } from '../Editor';
import { MarkdownPreview } from '../Preview';

// Type from Rust backend (snake_case)
interface BackendFileItem {
  name: string;
  path: string;
  is_directory: boolean;
  is_markdown?: boolean;
}

export function AppLayout() {
  const [directoryPath, setDirectoryPath] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectDirectory = useCallback(async () => {
    try {
      setError(null);
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === 'string') {
        setDirectoryPath(selected);
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

  return (
    <div
      data-testid="app-layout"
      className="flex h-screen w-screen overflow-hidden bg-gray-100 dark:bg-gray-800"
    >
      {/* File Explorer Column */}
      <div
        data-testid="file-explorer-column"
        className="flex h-full w-64 flex-col border-r border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="border-b border-gray-300 p-4 dark:border-gray-700">
          <button
            onClick={handleSelectDirectory}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Select Directory
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <FileExplorer files={files} onFileSelect={handleFileSelect} showDirectoryButton={false} />
        </div>
      </div>

      {/* Editor Column */}
      <div
        data-testid="editor-column"
        className="flex h-full flex-1 flex-col border-r border-gray-300 dark:border-gray-700"
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
            content={content}
            onChange={handleContentChange}
            onSave={handleSave}
            filePath={selectedFilePath}
          />
        </div>
      </div>

      {/* Preview Column */}
      <div
        data-testid="preview-column"
        className="flex h-full flex-1 flex-col overflow-hidden bg-white dark:bg-gray-900"
      >
        <div className="border-b border-gray-300 bg-gray-50 p-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          Preview
        </div>
        <div className="flex-1 overflow-auto">
          <MarkdownPreview content={content} />
        </div>
      </div>
    </div>
  );
}
