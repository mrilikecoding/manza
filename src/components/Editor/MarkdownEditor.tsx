import { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';

export interface MarkdownEditorProps {
  filePath: string | null;
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
}

export function MarkdownEditor({ filePath, content, onChange, onSave }: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [, setEditorReady] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

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
          onSave();
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
        oneDark,
        EditorView.editable.of(true),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString();
            onChange(newContent);

            // Auto-save after 2 seconds of inactivity
            if (autoSaveTimerRef.current) {
              clearTimeout(autoSaveTimerRef.current);
            }
            autoSaveTimerRef.current = setTimeout(() => {
              onSave();
            }, 2000);
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
  }, []);

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

  const fileName = filePath.split('/').pop() || 'Untitled';

  return (
    <div data-testid="markdown-editor" className="show-line-numbers flex h-full w-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
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
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{fileName}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>Markdown</span>
          <span>•</span>
          <span>Auto-save enabled</span>
        </div>
      </div>
      <div
        ref={editorRef}
        data-testid="editor-content"
        className="h-full w-full flex-1 overflow-auto"
      />
    </div>
  );
}
