export type OperationType = 'query' | 'mutation' | 'subscription' | 'persisted' | 'unknown';

export interface GraphQLPayload {
  operationName: string | null;
  operationType: OperationType;
  query: string | null;
  variables: Record<string, any> | null;
  extensions?: Record<string, any>;
}

export interface NetworkEvent {
  id: string; 
  requestId: string; 
  timestamp: number;
  url: string;
  method: string;
  status: number | null;
  
  // Request
  requestHeaders: Record<string, string>;
  requestBodyRaw: string | null;
  graphql: GraphQLPayload;
  
  // Response
  responseHeaders: Record<string, string> | null;
  responseBodyRaw: string | null;
  responseBodyJson: any | null;
  responseSize: number;
  duration: number;

  // Batching Support
  isBatched: boolean; 
  batchIndex?: number; 
}

export interface ExportBundle {
  meta: { tool: "GraphQeLves", version: "1.0", exportedAt: string };
  events: Array<{
    request: { url: string, method: string, headers: any, body: any, curl: string };
    response: { status: number, headers: any, body: any };
  }>;
}