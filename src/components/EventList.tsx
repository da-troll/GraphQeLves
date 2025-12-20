import React, { useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useStore } from '../store';
import { NetworkEvent } from '../types';
import { clsx } from 'clsx';

const formatBytes = (bytes: number, decimals = 1) => {
  // Handle invalid, zero, or negative (cached) sizes
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // Safety check for array bounds
  if (i < 0) return bytes + ' B';
  if (i >= sizes.length) return 'Large';

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const OperationBadge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    query: 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    mutation: 'text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    subscription: 'text-purple-700 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
    persisted: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
    unknown: 'text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
  };

  return (
    <span className={clsx("px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide", colors[type] || colors.unknown)}>
      {type.slice(0, 4)}
    </span>
  );
};

export const EventList: React.FC = () => {
  const events = useStore((state) => state.events);
  const selectedIds = useStore((state) => state.selectedEventIds);
  const selectEvent = useStore((state) => state.selectEvent);
  const selectMultiple = useStore((state) => state.selectMultiple);
  const filter = useStore((state) => state.filter);
  const setFilter = useStore((state) => state.setFilter);
  const searchQuery = useStore((state) => state.searchQuery);
  
  const lastSelectedIdRef = useRef<string | null>(null);

  // Filter Logic
  const filteredEvents = events.filter(e => {
    if (filter !== 'all' && e.graphql.operationType !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return e.graphql.operationName?.toLowerCase().includes(q) || 
             e.url.toLowerCase().includes(q);
    }
    return true;
  });

  const handleRowClick = (event: NetworkEvent, e: React.MouseEvent) => {
    if (e.shiftKey && lastSelectedIdRef.current) {
      const lastIndex = filteredEvents.findIndex(ev => ev.id === lastSelectedIdRef.current);
      const currentIndex = filteredEvents.findIndex(ev => ev.id === event.id);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const idsToSelect = filteredEvents.slice(start, end + 1).map(ev => ev.id);
        selectMultiple(idsToSelect);
      } else {
        selectEvent(event.id, true);
      }
    } else {
      // CMD/CTRL handled in store, but we pass the flag
      selectEvent(event.id, e.metaKey || e.ctrlKey);
    }
    
    lastSelectedIdRef.current = event.id;
  };

  const Row = (_index: number, event: NetworkEvent) => {
    const isSelected = selectedIds.has(event.id);
    
    return (
      <div
        onClick={(e) => handleRowClick(event, e)}
        className={clsx(
          "flex items-center text-xs p-2 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 select-none",
          isSelected && "!bg-blue-50 dark:!bg-blue-900/20"
        )}
      >
        {/* Status */}
        <div className="w-10 flex-shrink-0">
          {event.status && event.status >= 400 ? (
            <span className="text-red-500 font-bold">{event.status}</span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{event.status}</span>
          )}
        </div>

        {/* Type Badge */}
        <div className="w-14 flex-shrink-0">
          <OperationBadge type={event.graphql.operationType} />
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0 px-2 font-medium text-gray-700 dark:text-gray-200 truncate" title={event.graphql.operationName || 'Anonymous'}>
          {event.graphql.operationName || <span className="italic text-gray-400">Anonymous</span>}
        </div>

        {/* Size */}
        <div className="w-14 text-right text-gray-400 tabular-nums">
          {formatBytes(event.responseSize)}
        </div>

        {/* Time */}
        <div className="w-14 text-right text-gray-400 tabular-nums ml-2">
          {Math.round(event.duration)}ms
        </div>
      </div>
    );
  };

  const FilterButton = ({ type, label }: { type: typeof filter, label: string }) => (
    <button
      onClick={() => setFilter(type)}
      className={clsx(
        "px-2 py-1 rounded text-[10px] font-medium uppercase transition-colors border",
        filter === type 
          ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
          : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Top Search Bar */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex gap-2">
        <input 
          type="text" 
          placeholder="Filter events..." 
          className="flex-1 bg-gray-100 dark:bg-gray-800 text-xs px-2 py-1.5 rounded border-none focus:ring-1 focus:ring-blue-500 dark:text-gray-200 outline-none"
          value={searchQuery}
          onChange={(e) => useStore.getState().setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Virtual List */}
      <div className="flex-1 bg-white dark:bg-gray-900">
        <Virtuoso
          data={filteredEvents}
          itemContent={Row}
          className="no-scrollbar"
        />
      </div>

      {/* Bottom Filter Toggles & Stats */}
      <div className="flex-shrink-0 p-1.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between gap-2 overflow-x-auto">
         <div className="flex gap-1">
           <FilterButton type="all" label="All" />
           <FilterButton type="query" label="Query" />
           <FilterButton type="mutation" label="Mutation" />
           <FilterButton type="subscription" label="Sub" />
         </div>
         <div className="text-[10px] text-gray-400 whitespace-nowrap px-1">
           {selectedIds.size > 0 ? `${selectedIds.size} / ` : ''}{filteredEvents.length} events
         </div>
      </div>
    </div>
  );
};