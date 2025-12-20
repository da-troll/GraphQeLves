import React, { useState } from 'react';
import { useStore } from '../store';
import { clsx } from 'clsx';
import { Copy, Download, Check } from 'lucide-react';
import { generateCurl } from '../utils/curl';
import { createExportBundle, downloadBundle } from '../utils/export';

const JsonView = ({ data }: { data: any }) => (
  <pre className="text-xs font-mono p-4 overflow-auto text-gray-700 dark:text-gray-300">
    {JSON.stringify(data, null, 2)}
  </pre>
);

const CodeBlock = ({ code }: { code: string }) => (
  <pre className="text-xs font-mono p-4 overflow-auto text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
    {code}
  </pre>
);

const ActionButton = ({ onClick, label, icon: Icon }: { onClick: () => void, label: string, icon: any }) => {
  const [copied, setCopied] = useState(false);
  
  const handleClick = () => {
    onClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Icon size={14} />}
      {copied ? 'Copied' : label}
    </button>
  );
};

export const DetailPane: React.FC = () => {
  const events = useStore((state) => state.events);
  const selectedIds = useStore((state) => state.selectedEventIds);
  
  const selectedEvents = events.filter(e => selectedIds.has(e.id));
  const [activeTab, setActiveTab] = useState<'headers' | 'request' | 'response' | 'raw'>('request');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleExport = () => {
    const bundle = createExportBundle(selectedEvents);
    downloadBundle(bundle);
  };

  // No selection state
  if (selectedEvents.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400 bg-white dark:bg-gray-900">
        <p>Select a request to view details</p>
      </div>
    );
  }

  // Multi-select summary state
  if (selectedEvents.length > 1) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 p-8 overflow-auto">
        <h2 className="text-xl font-bold mb-4 dark:text-white">{selectedEvents.length} items selected</h2>
        <div className="space-y-4 max-w-2xl">
          <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
             <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">Bulk Export</h3>
             <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
               Download a secured JSON bundle containing full request/response details for all selected events, including cURL commands.
             </p>
             <button 
               onClick={handleExport}
               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
             >
               <Download size={16} />
               Export {selectedEvents.length} Events
             </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
             <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-bold text-xs uppercase text-gray-500">Selected Operations</h3>
             </div>
             <ul className="divide-y divide-gray-100 dark:divide-gray-800 max-h-96 overflow-y-auto">
               {selectedEvents.map(e => (
                 <li key={e.id} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                   <div className="flex justify-between">
                     <span className="font-medium">{e.graphql.operationName || 'Anonymous'}</span>
                     <span className="text-xs text-gray-400 font-mono">{e.graphql.operationType}</span>
                   </div>
                   <div className="text-xs text-gray-400 truncate mt-0.5">{e.url}</div>
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </div>
    );
  }

  // Single Selection State
  const event = selectedEvents[0];
  const tabs = ['request', 'response', 'raw', 'headers'];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-start gap-4">
         <div className="min-w-0">
           <h1 className="font-bold text-lg dark:text-white break-all truncate leading-tight">
             {event.graphql.operationName || 'Anonymous Operation'}
           </h1>
           <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
             <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
               event.method === 'POST' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
             }`}>{event.method}</span>
             <span className="font-mono truncate">{event.url}</span>
           </div>
         </div>
         <div className="flex-shrink-0">
            <button 
              onClick={handleExport}
              title="Export JSON Bundle"
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            >
              <Download size={18} />
            </button>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t as any)}
            className={clsx(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
              activeTab === t 
                ? "border-blue-500 text-blue-600 dark:text-blue-400" 
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-[#0d1117]">
        {activeTab === 'request' && (
          <div className="h-full flex flex-col">
            {/* Actions Bar */}
            <div className="p-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
               <ActionButton 
                 icon={Copy} 
                 label="Copy Query" 
                 onClick={() => handleCopy(event.graphql.query || '')} 
               />
               <ActionButton 
                 icon={Copy} 
                 label="Copy Variables" 
                 onClick={() => handleCopy(JSON.stringify(event.graphql.variables, null, 2))} 
               />
               <ActionButton 
                 icon={Copy} 
                 label="Copy cURL" 
                 onClick={() => handleCopy(generateCurl(event))} 
               />
            </div>

            <div className="p-2 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 text-xs font-mono text-gray-500 uppercase tracking-wide">
               Variables
            </div>
            <div className="flex-1 border-b dark:border-gray-700 min-h-[100px] overflow-auto bg-white dark:bg-transparent">
               <JsonView data={event.graphql.variables} />
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-800 border-b border-t dark:border-gray-700 text-xs font-mono text-gray-500 uppercase tracking-wide">
               Query
            </div>
            <div className="flex-[2] overflow-auto bg-white dark:bg-transparent">
              <CodeBlock code={event.graphql.query || ''} />
            </div>
          </div>
        )}

        {activeTab === 'response' && (
           <div className="h-full flex flex-col">
             <div className="p-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex gap-2 justify-end">
               <ActionButton 
                 icon={Copy} 
                 label="Copy JSON" 
                 onClick={() => handleCopy(JSON.stringify(event.responseBodyJson, null, 2))} 
               />
             </div>
             <JsonView data={event.responseBodyJson} />
           </div>
        )}

        {activeTab === 'raw' && (
           <div className="h-full flex flex-col">
             <div className="p-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex gap-2 justify-end">
               <ActionButton 
                 icon={Copy} 
                 label="Copy Raw" 
                 onClick={() => handleCopy(event.responseBodyRaw || '')} 
               />
             </div>
             <CodeBlock code={event.responseBodyRaw || ''} />
           </div>
        )}

        {activeTab === 'headers' && (
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">Request Headers</h3>
              <JsonView data={event.requestHeaders} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">Response Headers</h3>
              <JsonView data={event.responseHeaders} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};