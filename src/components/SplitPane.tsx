import React, { useState, useCallback, useRef } from 'react';

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialLeftWidth?: number;
}

export const SplitPane: React.FC<SplitPaneProps> = ({ left, right, initialLeftWidth = 400 }) => {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    // Min/Max constraints
    if (newWidth > 100 && newWidth < containerRect.width - 100) {
      setLeftWidth(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
  }, []);

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden select-none">
      <div style={{ width: leftWidth }} className="h-full flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {left}
      </div>
      
      {/* Resizer Handle */}
      <div 
        className="w-1 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors bg-gray-200 dark:bg-gray-800 z-10"
        onMouseDown={handleMouseDown}
      />
      
      <div className="flex-1 h-full min-w-0 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {right}
      </div>
    </div>
  );
};