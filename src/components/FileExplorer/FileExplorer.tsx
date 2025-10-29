import { invoke } from '@tauri-apps/api';

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isMarkdown?: boolean;
  expanded?: boolean;
}

export interface FileExplorerProps {
  rootPath?: string | null;
  files?: FileItem[];
  onFileSelect: (path: string) => void;
  showDirectoryButton?: boolean;
}

export function FileExplorer({ rootPath, files = [], onFileSelect, showDirectoryButton = true }: FileExplorerProps) {
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

  return (
    <div
      data-testid="file-explorer"
      className="h-full w-full overflow-auto bg-white p-4 dark:bg-gray-900"
    >
      <div className="space-y-1">
        {sortedFiles.map((file) => {
          const isMarkdown = !file.isDirectory && isMarkdownFile(file.name);

          return (
            <div
              key={file.path}
              data-testid={`file-item-${file.name}`}
              onClick={() => handleFileClick(file)}
              className={`
                flex cursor-pointer items-center rounded px-3 py-2 text-sm
                transition-colors hover:bg-gray-100 dark:hover:bg-gray-800
                ${file.isDirectory ? 'font-semibold' : ''}
              `}
            >
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
                  className="mr-2 h-4 w-4 text-gray-400"
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
        })}
      </div>
    </div>
  );
}
