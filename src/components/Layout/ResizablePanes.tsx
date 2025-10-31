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
        className={`flex h-full flex-col ${isLeftCollapsed ? 'hidden' : ''}`}
        style={{
          width: isLeftCollapsed ? '0%' : isRightCollapsed ? '100%' : `${leftWidth}%`,
          minWidth: isLeftCollapsed ? '0' : '20%',
        }}
      >
        <div className="flex-1 overflow-auto">{leftContent}</div>
      </div>

      {/* Divider */}
      {!isLeftCollapsed && !isRightCollapsed && (
        <div
          data-testid="pane-divider"
          draggable="true"
          onMouseDown={handleMouseDown}
          className="w-1 cursor-col-resize bg-gray-300 hover:bg-blue-500 dark:bg-gray-700 dark:hover:bg-blue-600"
        />
      )}

      {/* Right Pane */}
      <div
        data-testid="right-pane"
        className={`flex h-full flex-col ${isRightCollapsed ? 'hidden' : ''}`}
        style={{
          width: isRightCollapsed ? '0%' : isLeftCollapsed ? '100%' : `${rightWidth}%`,
          minWidth: isRightCollapsed ? '0' : '20%',
        }}
      >
        <div className="flex-1 overflow-auto">{rightContent}</div>
      </div>
    </div>
  );
}
