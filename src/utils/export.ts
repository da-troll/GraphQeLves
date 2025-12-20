import { NetworkEvent, ExportBundle } from '../types';
import { generateCurl } from './curl';

const REDACTED_KEYS = ['authorization', 'cookie', 'x-api-key', 'api-key', 'set-cookie'];

const redactHeaders = (headers: Record<string, string>): Record<string, string> => {
  const clean: Record<string, string> = {};
  Object.keys(headers).forEach(key => {
    if (REDACTED_KEYS.includes(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else {
      clean[key] = headers[key];
    }
  });
  return clean;
};

export const createExportBundle = (events: NetworkEvent[]): ExportBundle => {
  return {
    meta: {
      tool: "GraphQeLves",
      version: "1.0",
      exportedAt: new Date().toISOString()
    },
    events: events.map(e => ({
      request: {
        url: e.url,
        method: e.method,
        headers: redactHeaders(e.requestHeaders),
        body: e.graphql, 
        curl: generateCurl(e)
      },
      response: {
        status: e.status || 0,
        headers: redactHeaders(e.responseHeaders || {}),
        body: e.responseBodyJson || e.responseBodyRaw
      }
    }))
  };
};

export const downloadBundle = (bundle: ExportBundle) => {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `graphqelves-export-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};