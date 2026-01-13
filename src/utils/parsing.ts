import { GraphQLPayload, OperationType } from '../types';

export const safeJSONParse = (str: string | null) => {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

// Extract operation name from query string when operationName field is missing
// e.g., "query GetUser { ... }" -> "GetUser"
const extractNameFromQuery = (query: string | null | undefined): string | null => {
  if (!query) return null;
  const match = query.match(/^[\s]*(query|mutation|subscription)\s+([A-Za-z_]\w*)/);
  return match?.[2] ?? null;
};

// Get operation name: prefer explicit operationName, fallback to parsing query
const getOperationName = (item: { operationName?: string; query?: string }): string | null => {
  return item.operationName || extractNameFromQuery(item.query) || null;
};

export const determineOperationType = (body: any): OperationType => {
  if (body?.operationName === 'IntrospectionQuery') return 'query'; 
  if (body?.query?.trim().startsWith('mutation')) return 'mutation';
  if (body?.query?.trim().startsWith('subscription')) return 'subscription';
  if (body?.extensions?.persistedQuery) return 'persisted';
  if (body?.query?.trim().startsWith('query')) return 'query';
  
  // Default to query if we have a query string but no prefix
  if (typeof body?.query === 'string') return 'query';
  
  return 'unknown';
};

// Helper to check if a single object looks like a GraphQL payload
const isGraphQLObject = (item: any): boolean => {
  if (!item || typeof item !== 'object') return false;
  // Must have at least one standard GraphQL key
  return 'query' in item || 'operationName' in item || 'extensions' in item;
};

export const parseGraphQLBody = (
  postData: { mimeType: string; text?: string; params?: any[] }
): GraphQLPayload[] | null => {
  if (!postData || !postData.text) return null;

  // 1. Handle JSON
  if (postData.mimeType.includes('application/json')) {
    const json = safeJSONParse(postData.text);
    if (!json) return null;

    // Handle Batch (Array)
    if (Array.isArray(json)) {
      // STRICT FILTER: Filter out items that are not GraphQL (e.g., analytics events)
      const validItems = json.filter(isGraphQLObject);
      
      if (validItems.length === 0) return null;

      return validItems.map((item) => ({
        operationName: getOperationName(item),
        operationType: determineOperationType(item),
        query: item.query || null,
        variables: item.variables || null,
        extensions: item.extensions,
      }));
    }

    // Handle Single Object
    if (isGraphQLObject(json)) {
      return [{
        operationName: getOperationName(json),
        operationType: determineOperationType(json),
        query: json.query || null,
        variables: json.variables || null,
        extensions: json.extensions,
      }];
    }
  }

  // 2. Handle Multipart (Uploads)
  if (postData.mimeType.includes('multipart/form-data')) {
    try {
      const operationsMatch = postData.text.match(/name="operations"\r\n\r\n(.*)\r\n/);
      if (operationsMatch && operationsMatch[1]) {
        const json = safeJSONParse(operationsMatch[1]);
        if (json && isGraphQLObject(json)) {
           return [{
            operationName: getOperationName(json),
            operationType: determineOperationType(json),
            query: json.query || null,
            variables: json.variables || null,
            extensions: json.extensions,
          }];
        }
      }
    } catch (e) {
      console.error("Failed to parse multipart GraphQL", e);
    }
  }

  return null;
};