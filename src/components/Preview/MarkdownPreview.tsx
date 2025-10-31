import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeSanitize from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { isInlineCode } from 'react-shiki';
import { useEffect } from 'react';
import { open } from '@tauri-apps/api/shell';
import 'katex/dist/katex.min.css';
import { CodeBlock } from './CodeBlock';
import { MermaidDiagram } from './MermaidDiagram';
import { useTheme } from '../../contexts/ThemeContext';

export interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const { effectiveTheme } = useTheme();

  // Dynamically load the correct GitHub markdown CSS based on theme
  useEffect(() => {
    // Remove existing github markdown stylesheets
    const existingLinks = document.querySelectorAll('link[href*="github-markdown"]');
    existingLinks.forEach(link => link.remove());

    // Add the correct stylesheet for the current theme
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = effectiveTheme === 'dark'
      ? '/node_modules/github-markdown-css/github-markdown-dark.css'
      : '/node_modules/github-markdown-css/github-markdown-light.css';
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [effectiveTheme]);

  if (!content || content.trim() === '') {
    return (
      <div
        data-testid="markdown-preview"
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
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            Preview will appear here
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Start editing markdown to see the live preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="markdown-preview"
      className="markdown-body h-full overflow-auto bg-white p-8 dark:bg-gray-900"
      data-theme={effectiveTheme}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex]}
        components={{
          // Open links in default browser
          a: ({ node, href, children, ...props }) => {
            const handleClick = (e: React.MouseEvent) => {
              e.preventDefault();
              if (href) {
                open(href);
              }
            };

            return (
              <a
                href={href}
                onClick={handleClick}
                {...props}
                style={{ cursor: 'pointer' }}
              >
                {children}
              </a>
            );
          },
          // Custom rendering for task lists
          input: ({ node, ...props }) => {
            if (props.type === 'checkbox') {
              return <input {...props} disabled />;
            }
            return <input {...props} />;
          },
          // Syntax highlighting for code blocks and Mermaid diagrams
          code: ({ node, className, children, ...props }) => {
            // Check if this is inline code
            if (isInlineCode(node)) {
              return <code className={className} {...props}>{children}</code>;
            }

            // Extract language from className (format: "language-javascript")
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'plaintext';

            // Get the code content as a string
            const codeContent = String(children).replace(/\n$/, '');

            // Check if this is a Mermaid diagram
            if (language === 'mermaid') {
              return <MermaidDiagram chart={codeContent} />;
            }

            // Otherwise, render with syntax highlighting
            return <CodeBlock code={codeContent} language={language} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
