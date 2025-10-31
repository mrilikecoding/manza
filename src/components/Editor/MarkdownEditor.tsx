import { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { useTheme } from '../../contexts/ThemeContext';

export interface MarkdownEditorProps {
  filePath: string | null;
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  autoSaveEnabled?: boolean;
  suppressAutoSave?: boolean; // Temporarily suppress auto-save (e.g., during external reload)
  onToggleAutoSave?: () => void;
  hasUnsavedChanges?: boolean;
}

export function MarkdownEditor({
  filePath,
  content,
  onChange,
  onSave,
  isSaving = false,
  autoSaveEnabled = true,
  suppressAutoSave = false,
  onToggleAutoSave,
  hasUnsavedChanges = false,
}: MarkdownEditorProps) {
  const { effectiveTheme } = useTheme();
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [, setEditorReady] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Use refs to track current values for use in the update listener
  const autoSaveEnabledRef = useRef(autoSaveEnabled);
  const suppressAutoSaveRef = useRef(suppressAutoSave);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);

  // Update refs when props change
  useEffect(() => {
    autoSaveEnabledRef.current = autoSaveEnabled;
  }, [autoSaveEnabled]);

  useEffect(() => {
    suppressAutoSaveRef.current = suppressAutoSave;
  }, [suppressAutoSave]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Initialize editor
  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    // Custom keymap for markdown shortcuts
    const markdownKeymap = keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      {
        key: 'Mod-s',
        run: () => {
          onSaveRef.current();
          return true;
        },
      },
      {
        key: 'Mod-b',
        run: (view) => {
          const { from, to } = view.state.selection.main;
          const selectedText = view.state.sliceDoc(from, to);
          const boldText = `**${selectedText}**`;
          view.dispatch({
            changes: { from, to, insert: boldText },
            selection: { anchor: from + boldText.length },
          });
          return true;
        },
      },
      {
        key: 'Mod-i',
        run: (view) => {
          const { from, to } = view.state.selection.main;
          const selectedText = view.state.sliceDoc(from, to);
          const italicText = `*${selectedText}*`;
          view.dispatch({
            changes: { from, to, insert: italicText },
            selection: { anchor: from + italicText.length },
          });
          return true;
        },
      },
    ]);

    const startState = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        history(),
        markdown(),
        markdownKeymap,
        ...(effectiveTheme === 'dark' ? [oneDark] : []),
        EditorView.editable.of(true),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString();
            onChangeRef.current(newContent);

            // Auto-save after 2 seconds of inactivity (if enabled and not suppressed)
            if (autoSaveEnabledRef.current && !suppressAutoSaveRef.current) {
              if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
              }
              autoSaveTimerRef.current = setTimeout(() => {
                onSaveRef.current();
              }, 2000);
            } else if (suppressAutoSaveRef.current) {
              // Clear any pending auto-save when suppressed
              if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
                autoSaveTimerRef.current = null;
              }
            }
          }
        }),
        EditorView.lineWrapping,
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, Courier, monospace',
          },
          '.cm-content': {
            minHeight: '100%',
            padding: '10px',
          },
          '.cm-line': {
            padding: '0 4px',
          },
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;
    setEditorReady(true);

    return () => {
      view.destroy();
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveTheme]);

  // Update content when filePath or content changes
  useEffect(() => {
    if (viewRef.current && content !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: content,
        },
      });
    }
  }, [content, filePath]);

  if (!filePath) {
    return (
      <div
        data-testid="markdown-editor"
        className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-gray-900"
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            No file open
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Select a markdown file from the file explorer to start editing
          </p>
        </div>
      </div>
    );
  }

  // Format file path for display (show filename with truncated parent path)
  const formatFilePathForDisplay = (fullPath: string) => {
    const parts = fullPath.split('/');
    const filename = parts[parts.length - 1];

    // If path is short, just show it
    if (fullPath.length <= 50) {
      return fullPath;
    }

    // Show ".../" + last few directories + filename
    const parentPath = parts.slice(0, -1).join('/');
    const truncatedParent = parentPath.length > 30
      ? '.../' + parts.slice(-3, -1).join('/')
      : parentPath;

    return truncatedParent + '/' + filename;
  };

  const displayPath = filePath ? formatFilePathForDisplay(filePath) : 'Untitled';

  return (
    <div data-testid="markdown-editor" className="show-line-numbers flex h-full w-full flex-col">
      <div className="sticky top-0 z-10 flex h-11 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <svg
            className="h-5 w-5 text-gray-500"
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
          <span
            className="text-sm font-medium text-gray-900 dark:text-gray-100"
            title={filePath || undefined}
          >
            {displayPath}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Markdown</span>
        </div>
        <div className="flex items-center space-x-2">
          {isSaving && (
            <span className="text-xs text-gray-500 dark:text-gray-400">Saving...</span>
          )}

          {/* Manual Save Button */}
          <button
            onClick={onSave}
            disabled={isSaving || autoSaveEnabled}
            className={`rounded p-1 ${
              isSaving || autoSaveEnabled
                ? 'cursor-not-allowed opacity-50 text-gray-600 dark:text-gray-400'
                : hasUnsavedChanges
                ? 'bg-teal-100 text-teal-600 hover:bg-teal-200 dark:bg-teal-900 dark:text-teal-400 dark:hover:bg-teal-800'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
            title={autoSaveEnabled ? "Auto-save is enabled" : hasUnsavedChanges ? "Unsaved changes (Cmd+S to save)" : "No changes to save"}
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
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
          </button>

          {/* Auto-save Toggle */}
          {onToggleAutoSave && (
            <button
              onClick={onToggleAutoSave}
              className={`rounded p-1 ${
                autoSaveEnabled
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
              title={autoSaveEnabled ? "Auto-save enabled (click to disable)" : "Auto-save disabled (click to enable)"}
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div
        ref={editorRef}
        data-testid="editor-content"
        className="w-full flex-1 overflow-auto"
      />
    </div>
  );
}
