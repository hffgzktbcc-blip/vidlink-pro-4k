export interface AddonRequest {
  method?: string;
  url: string;
  headers?: Record<string, string>;
  body?: Record<string, any>;
}

export interface AddonResponse {
  type: string; // 'json'
  resultsPath: string; // e.g. "docs", "hits", or "" for root array
  mapping: Record<string, string>; // e.g. { "title": "name", "cover": "cover_i" }
}

export interface MetadataProvider {
  id: string;
  name: string;
  version: string;
  type: 'metadata';
  search: {
    request: AddonRequest;
    response: AddonResponse;
  };
}

export interface DownloadSource {
  id: string;
  name: string;
  version: string;
  type: 'download';
  request: AddonRequest;
  response: AddonResponse;
}

export type Addon = MetadataProvider | DownloadSource;
