import { useEffect } from 'react';
import { useStore } from '../store';
import { NetworkEvent } from '../types';
import { parseGraphQLBody, safeJSONParse } from '../utils/parsing';

// Simple ID generator if uuid package isn't present, though it's standard to add it.
// For now, simple random string to avoid install steps if not requested.
const generateId = () => Math.random().toString(36).substring(2, 15);

export const useNetworkMonitor = () => {
  const addEvent = useStore((state) => state.addEvent);

  useEffect(() => {
    // @ts-ignore
    if (typeof chrome === 'undefined' || !chrome.devtools) {
      console.warn("Chrome DevTools API not available. Starting in Mock Mode.");
      const interval = setInterval(() => {
        // Mock Data Generator for Development
        const types = ['query', 'mutation'];
        const ops = ['GetUser', 'UpdatePost', 'ListComments'];
        const type = types[Math.floor(Math.random() * types.length)];
        const op = ops[Math.floor(Math.random() * ops.length)];
        
        const mockEvent: NetworkEvent = {
          id: generateId(),
          requestId: `req-${Date.now()}`,
          timestamp: Date.now(),
          url: 'https://api.example.com/graphql',
          method: 'POST',
          status: 200,
          requestHeaders: { 'Content-Type': 'application/json', 'Authorization': 'Bearer xyz' },
          requestBodyRaw: JSON.stringify({ query: `query ${op} { id }` }),
          graphql: {
            operationName: op,
            operationType: type as any,
            query: `query ${op} { \n  field \n}`,
            variables: { id: 123 }
          },
          responseHeaders: { 'Content-Type': 'application/json' },
          responseBodyRaw: '{"data": { "success": true }}',
          responseBodyJson: { data: { success: true } },
          responseSize: 124,
          duration: Math.floor(Math.random() * 500),
          isBatched: false
        };
        addEvent(mockEvent);
      }, 3000);
      return () => clearInterval(interval);
    }

    const handleRequest = async (request: any) => {
      // 1. Filter: Must be JSON or end in /graphql
      const isJson = request.request.postData?.mimeType?.includes('application/json');
      const isGraphQLUrl = request.request.url.endsWith('/graphql');
      
      if (!isJson && !isGraphQLUrl) return;

      // 2. Parse Body
      const payloads = parseGraphQLBody(request.request.postData);
      if (!payloads || payloads.length === 0) return;

      // 3. Get Response Body (Async)
      request.getContent((content: string, _encoding: string) => {
        const responseJson = safeJSONParse(content);

        const headersToRecord = (headers: any[]) =>
          headers.reduce((acc, h) => ({ ...acc, [h.name]: h.value }), {});

        // Calculate response size - prefer bodySize, fallback to content length
        const getResponseSize = (): number => {
          // Try HAR bodySize first
          if (request.response.bodySize > 0) {
            return request.response.bodySize;
          }
          // Try content-length header
          const contentLengthHeader = request.response.headers.find(
            (h: any) => h.name.toLowerCase() === 'content-length'
          );
          if (contentLengthHeader) {
            const parsed = parseInt(contentLengthHeader.value, 10);
            if (!isNaN(parsed) && parsed > 0) return parsed;
          }
          // Fallback to actual content byte length
          if (content) {
            return new TextEncoder().encode(content).length;
          }
          return 0;
        };

        // 4. Create Events (Handle Batching)
        payloads.forEach((payload, index) => {
          const event: NetworkEvent = {
            id: generateId(),
            requestId: request.request.id || generateId(),
            timestamp: new Date(request.startedDateTime).getTime(),
            url: request.request.url,
            method: request.request.method,
            status: request.response.status,

            requestHeaders: headersToRecord(request.request.headers),
            requestBodyRaw: request.request.postData?.text || null,
            graphql: payload,

            responseHeaders: headersToRecord(request.response.headers),
            responseBodyRaw: content,
            responseBodyJson: responseJson,
            responseSize: getResponseSize(),
            duration: request.time,

            isBatched: payloads.length > 1,
            batchIndex: payloads.length > 1 ? index : undefined,
          };

          addEvent(event);
        });
      });
    };

    // @ts-ignore
    chrome.devtools.network.onRequestFinished.addListener(handleRequest);

    return () => {
      // @ts-ignore
      chrome.devtools.network.onRequestFinished.removeListener(handleRequest);
    };
  }, [addEvent]);
};