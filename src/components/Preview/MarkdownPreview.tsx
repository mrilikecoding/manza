import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import 'github-markdown-css/github-markdown-light.css';

export interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
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
      className="markdown-body h-full w-full overflow-auto bg-white p-8 dark:bg-gray-900"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Custom rendering for task lists
          input: ({ node, ...props }) => {
            if (props.type === 'checkbox') {
              return <input {...props} disabled />;
            }
            return <input {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
