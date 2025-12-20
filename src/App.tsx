import React from 'react';
import { useNetworkMonitor } from './hooks/useNetworkMonitor';
import { SplitPane } from './components/SplitPane';
import { EventList } from './components/EventList';
import { DetailPane } from './components/DetailPane';
import { useStore } from './store';
import { Loader2, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  // Initialize listener
  useNetworkMonitor();
  
  const clearEvents = useStore((state) => state.clearEvents);

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header Bar */}
      <header className="h-10 flex items-center px-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-sm tracking-tight text-blue-600 dark:text-blue-400">GraphQeLves</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={clearEvents}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400"
            title="Clear All"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <SplitPane 
          initialLeftWidth={350}
          left={<EventList />}
          right={<DetailPane />}
        />
      </div>
    </div>
  );
};

export default App;