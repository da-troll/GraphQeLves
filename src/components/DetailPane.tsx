import React, { useState } from 'react';
import { useStore } from '../store';
import { clsx } from 'clsx';
import { Copy, Download, Check } from 'lucide-react';
import { generateCurl } from '../utils/curl';
import { createExportBundle, downloadBundle } from '../utils/export';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Custom theme with more vibrant colors
const vibrantTheme = {
  ...vscDarkPlus,
  'code[class*="language-"]': {
    ...vscDarkPlus['code[class*="language-"]'],
    background: '#151820',
  },
  'pre[class*="language-"]': {
    ...vscDarkPlus['pre[class*="language-"]'],
    background: '#151820',
  },
  'string': { color: '#98c379' },
  'number': { color: '#d19a66' },
  'boolean': { color: '#d19a66' },
  'null': { color: '#d19a66' },
  'keyword': { color: '#c678dd' },
  'property': { color: '#61afef' },
  'punctuation': { color: '#abb2bf' },
  'operator': { color: '#56b6c2' },
  'function': { color: '#61afef' },
  'attr-name': { color: '#d19a66' },
  'attr-value': { color: '#98c379' },
};

const JsonView = ({ data }: { data: any }) => (
  <div className="text-xs overflow-auto h-full">
    <SyntaxHighlighter
      language="json"
      style={vibrantTheme}
      customStyle={{ margin: 0, height: '100%', fontSize: '11px', lineHeight: '1.5', background: '#151820', padding: '12px' }}
      wrapLongLines={true}
    >
      {JSON.stringify(data, null, 2)}
    </SyntaxHighlighter>
  </div>
);

const CodeBlock = ({ code, language = 'graphql' }: { code: string, language?: string }) => (
  <div className="text-xs overflow-auto h-full">
    <SyntaxHighlighter
      language={language}
      style={vibrantTheme}
      customStyle={{ margin: 0, height: '100%', fontSize: '11px', lineHeight: '1.5', background: '#151820', padding: '12px' }}
      wrapLongLines={true}
    >
      {code}
    </SyntaxHighlighter>
  </div>
);

const ActionButton = ({ onClick, label, icon: Icon }: { onClick: () => Promise<void> | void, label: string, icon: any }) => {
  const [copied, setCopied] = useState(false);
  
  const handleClick = async () => {
    await onClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-700 shadow-sm"
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

  const handleCopy = async (text: string) => {
    if (!text) return;

    try {
      // Try modern Async Clipboard API first
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.warn("Clipboard API failed, attempting fallback...", err);
      // Fallback: Create a temporary text area
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Ensure it's not visible but part of the DOM
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
      } catch (e) {
        console.error("Fallback copy failed", e);
      }
      
      document.body.removeChild(textArea);
    }
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
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-start gap-4 flex-shrink-0">
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
      <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t as any)}
            className={clsx(
              "px-2 py-2 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap",
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
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-[#1e1e1e] relative">
        {activeTab === 'request' && (
          <div className="h-full flex flex-col">
            {/* Actions Bar */}
            <div className="p-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 flex-shrink-0">
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

            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 min-h-0 flex flex-col border-b border-gray-200 dark:border-gray-700">
                    <div className="p-1 px-2 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 text-[10px] font-mono text-gray-500 uppercase tracking-wide flex-shrink-0">
                        Variables
                    </div>
                    <div className="flex-1 min-h-0 relative">
                        <div className="absolute inset-0">
                            <JsonView data={event.graphql.variables} />
                        </div>
                    </div>
                </div>
                <div className="flex-[2] min-h-0 flex flex-col">
                    <div className="p-1 px-2 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 text-[10px] font-mono text-gray-500 uppercase tracking-wide flex-shrink-0">
                        Query
                    </div>
                    <div className="flex-1 min-h-0 relative">
                        <div className="absolute inset-0">
                             <CodeBlock code={event.graphql.query || ''} language="graphql" />
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'response' && (
           <div className="h-full flex flex-col relative group">
             <div className="absolute top-4 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
               <ActionButton 
                 icon={Copy} 
                 label="Copy JSON" 
                 onClick={() => handleCopy(JSON.stringify(event.responseBodyJson, null, 2))} 
               />
             </div>
             <div className="flex-1 min-h-0 relative">
                <div className="absolute inset-0">
                    <JsonView data={event.responseBodyJson} />
                </div>
             </div>
           </div>
        )}

        {activeTab === 'raw' && (
           <div className="h-full flex flex-col relative group">
             <div className="absolute top-4 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
               <ActionButton 
                 icon={Copy} 
                 label="Copy Raw" 
                 onClick={() => handleCopy(event.responseBodyRaw || '')} 
               />
             </div>
             <div className="flex-1 min-h-0 relative">
                <div className="absolute inset-0">
                     <CodeBlock code={event.responseBodyRaw || ''} language="text" />
                </div>
             </div>
           </div>
        )}

        {activeTab === 'headers' && (
          <div className="h-full overflow-auto relative group">
            <div className="absolute top-4 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <ActionButton
                icon={Copy}
                label="Copy Headers"
                onClick={() => handleCopy(JSON.stringify({ request: event.requestHeaders, response: event.responseHeaders }, null, 2))}
              />
            </div>
            <div className="h-1/2 flex flex-col border-b border-gray-700">
              <h3 className="text-xs font-bold uppercase text-gray-500 p-2 bg-gray-100 dark:bg-gray-800 flex-shrink-0">Request Headers</h3>
              <div className="flex-1 min-h-0 relative">
                <div className="absolute inset-0">
                     <JsonView data={event.requestHeaders} />
                </div>
              </div>
            </div>
            <div className="h-1/2 flex flex-col">
              <h3 className="text-xs font-bold uppercase text-gray-500 p-2 bg-gray-100 dark:bg-gray-800 flex-shrink-0">Response Headers</h3>
               <div className="flex-1 min-h-0 relative">
                <div className="absolute inset-0">
                    <JsonView data={event.responseHeaders} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};