import { useEffect, useRef, useState, useMemo } from 'react';
import mermaid from 'mermaid';

export interface MermaidDiagramProps {
  chart: string;
}

// Initialize Mermaid once
let isInitialized = false;
const initializeMermaid = () => {
  if (!isInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      logLevel: 'error',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
      },
      gantt: {
        useMaxWidth: true,
      },
    });
    isInitialized = true;
  }
};

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [id] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize the chart to only change when content actually changes
  const stableChart = useMemo(() => chart.trim(), [chart]);

  useEffect(() => {
    // Clear any pending render
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    // Debounce rendering by 300ms to avoid re-rendering on every keystroke
    renderTimeoutRef.current = setTimeout(async () => {
      if (!stableChart || !elementRef.current) return;

      try {
        // Initialize Mermaid if not already done
        initializeMermaid();

        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(id, stableChart);
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram');
      }
    }, 300);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [stableChart, id]);

  // Show error state
  if (error) {
    return (
      <div
        data-testid="mermaid-diagram"
        className="border border-red-300 bg-red-50 p-4 rounded"
      >
        <p className="text-red-800 text-sm font-medium">Error rendering diagram</p>
        <pre className="text-red-600 text-xs mt-2 overflow-auto">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  // Show loading state
  if (!svg) {
    return (
      <div
        data-testid="mermaid-diagram"
        ref={elementRef}
        className="bg-gray-50 p-4 rounded flex items-center justify-center"
      >
        <p className="text-gray-500 text-sm">Loading diagram...</p>
      </div>
    );
  }

  // Render the SVG
  return (
    <div
      data-testid="mermaid-diagram"
      ref={elementRef}
      className="mermaid-diagram flex justify-center my-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
