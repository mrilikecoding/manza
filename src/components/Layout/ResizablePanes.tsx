import { useState, useRef, useEffect } from 'react';

export interface ResizablePanesProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  onResize?: (leftWidth: number, rightWidth: number) => void;
  onCollapseLeft?: () => void;
  onCollapseRight?: () => void;
  isLeftCollapsed?: boolean;
  isRightCollapsed?: boolean;
  initialLeftWidth?: number; // Percentage (0-100)
}

export function ResizablePanes({
  leftContent,
  rightContent,
  onResize,
  onCollapseLeft,
  onCollapseRight,
  isLeftCollapsed = false,
  isRightCollapsed = false,
  initialLeftWidth = 50,
}: ResizablePanesProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const MIN_WIDTH_PERCENT = 20;
  const MAX_WIDTH_PERCENT = 80;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const offsetX = e.clientX - containerRect.left;
      const newLeftWidthPercent = (offsetX / containerRect.width) * 100;

      // Enforce min/max constraints
      const constrainedWidth = Math.min(
        Math.max(newLeftWidthPercent, MIN_WIDTH_PERCENT),
        MAX_WIDTH_PERCENT
      );

      setLeftWidth(constrainedWidth);

      if (onResize) {
        onResize(constrainedWidth, 100 - constrainedWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onResize]);

  const rightWidth = 100 - leftWidth;

  return (
    <div
      ref={containerRef}
      data-testid="resizable-panes"
      className="flex h-full w-full"
    >
      {/* Left Pane */}
      <div
        data-testid="left-pane"
        className={`flex flex-col ${isLeftCollapsed ? 'hidden' : ''}`}
        style={{
          width: isLeftCollapsed ? '0%' : `${leftWidth}%`,
          minWidth: isLeftCollapsed ? '0' : '20%',
        }}
      >
        {/* Collapse Button */}
        {!isLeftCollapsed && (
          <div className="flex justify-end border-b border-gray-200 p-1 dark:border-gray-700">
            <button
              data-testid="collapse-left-button"
              onClick={onCollapseLeft}
              disabled={isRightCollapsed}
              className="rounded p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-800"
              title="Collapse editor"
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
        )}
        <div className="flex-1">{leftContent}</div>
      </div>

      {/* Expand Left Button (shown when left is collapsed) */}
      {isLeftCollapsed && (
        <div className="flex items-center">
          <button
            data-testid="expand-left-button"
            onClick={onCollapseLeft}
            className="rounded-r bg-gray-200 p-2 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            title="Expand editor"
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
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Divider */}
      {!isLeftCollapsed && !isRightCollapsed && (
        <div
          data-testid="pane-divider"
          draggable="true"
          onMouseDown={handleMouseDown}
          className="w-1 cursor-col-resize bg-gray-300 hover:bg-blue-500 dark:bg-gray-700 dark:hover:bg-blue-600"
        />
      )}

      {/* Expand Right Button (shown when right is collapsed) */}
      {isRightCollapsed && (
        <div className="flex items-center">
          <button
            data-testid="expand-right-button"
            onClick={onCollapseRight}
            className="rounded-l bg-gray-200 p-2 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            title="Expand preview"
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
      )}

      {/* Right Pane */}
      <div
        data-testid="right-pane"
        className={`flex flex-col ${isRightCollapsed ? 'hidden' : ''}`}
        style={{
          width: isRightCollapsed ? '0%' : `${rightWidth}%`,
          minWidth: isRightCollapsed ? '0' : '20%',
        }}
      >
        {/* Collapse Button */}
        {!isRightCollapsed && (
          <div className="flex justify-end border-b border-gray-200 p-1 dark:border-gray-700">
            <button
              data-testid="collapse-right-button"
              onClick={onCollapseRight}
              disabled={isLeftCollapsed}
              className="rounded p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-800"
              title="Collapse preview"
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
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1">{rightContent}</div>
      </div>
    </div>
  );
}
