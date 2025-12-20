import { GraphQLPayload, OperationType } from '../types';

export const safeJSONParse = (str: string | null) => {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
};

export const determineOperationType = (body: any): OperationType => {
  if (body?.operationName === 'IntrospectionQuery') return 'query'; // Handle specific cases
  if (body?.query?.trim().startsWith('mutation')) return 'mutation';
  if (body?.query?.trim().startsWith('subscription')) return 'subscription';
  if (body?.extensions?.persistedQuery) return 'persisted';
  if (body?.query?.trim().startsWith('query')) return 'query';
  // Default to query if we have a query string but no prefix
  if (typeof body?.query === 'string') return 'query';
  return 'unknown';
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
      return json.map((item) => ({
        operationName: item.operationName || null,
        operationType: determineOperationType(item),
        query: item.query || null,
        variables: item.variables || null,
        extensions: item.extensions,
      }));
    }

    // Handle Single
    if (json.query || json.operationName || json.extensions) {
      return [{
        operationName: json.operationName || null,
        operationType: determineOperationType(json),
        query: json.query || null,
        variables: json.variables || null,
        extensions: json.extensions,
      }];
    }
  }

  // 2. Handle Multipart (Uploads)
  // Spec: https://github.com/jaydenseric/graphql-multipart-request-spec
  if (postData.mimeType.includes('multipart/form-data')) {
    try {
      // Very naive parser for the 'operations' field in multipart
      // In a real HAR, text might be parsed differently depending on browser, 
      // but usually `postData.text` contains the raw boundary data.
      // This is complex to parse perfectly without a library, 
      // but we look for the "operations" key.
      
      const operationsMatch = postData.text.match(/name="operations"\r\n\r\n(.*)\r\n/);
      if (operationsMatch && operationsMatch[1]) {
        const json = safeJSONParse(operationsMatch[1]);
        if (json) {
           return [{
            operationName: json.operationName || null,
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