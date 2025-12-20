import { NetworkEvent } from '../types';

export const generateCurl = (event: NetworkEvent): string => {
  let command = `curl '${event.url}'`;
  
  // Method
  command += ` \\\n  -X ${event.method}`;

  // Headers
  const headers = event.requestHeaders || {};
  Object.keys(headers).forEach(key => {
    // Skip some headers that might cause issues or are auto-added by curl/browsers
    if (!['content-length', 'accept-encoding'].includes(key.toLowerCase())) {
        command += ` \\\n  -H '${key}: ${headers[key]}'`;
    }
  });

  // Body
  if (event.requestBodyRaw) {
    // Escape single quotes in body to prevent breaking the curl command
    const safeBody = event.requestBodyRaw.replace(/'/g, "'\\''");
    command += ` \\\n  --data-raw '${safeBody}'`;
  }

  command += ` \\\n  --compressed`;
  
  return command;
};