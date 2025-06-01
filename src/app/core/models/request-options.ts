// request-options.model.ts
export interface RequestOptions {
    withCredentials?: boolean;
    params?: any;
  }
export interface RequestOptionsWithHeaders extends RequestOptions {
    headers?: { [key: string]: string };
    customHeaders?: { [key: string]: string };
    customParams?: { [key: string]: string };   
    customEndpoint?: string;
    executionMode?: 'server' | 'client';
    transferState?: boolean;
    cache?: boolean;
    cacheKey?: string;
    cacheDuration?: number; // in milliseconds
    retryCount?: number; // Number of times to retry the request on failure
    retryDelay?: number; // Delay between retries in milliseconds
    timeout?: number; // Timeout for the request in milliseconds
    responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'document';
    observe?: 'body' | 'response' | 'events';
    reportProgress?: boolean; // Whether to report progress for upload/download
    signal?: AbortSignal; // For aborting the request
    body?: any; // For POST/PUT requests
}
