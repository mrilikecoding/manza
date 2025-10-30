import { useShikiHighlighter } from 'react-shiki';

export interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const result = useShikiHighlighter({
    code,
    lang: language,
    theme: 'github-light',
  });

  // Handle case where hook returns null or is loading
  if (!result || result.isLoading || result.error || !result.html) {
    return (
      <pre className="bg-gray-50 p-4 overflow-x-auto rounded">
        <code>{code}</code>
      </pre>
    );
  }

  // Render the syntax-highlighted HTML from Shiki
  return <div dangerouslySetInnerHTML={{ __html: result.html }} />;
}
