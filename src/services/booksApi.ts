import { addonEngine } from './addonEngine';

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string | null;
  publishedYear: string;
}

export async function searchBooks(query: string): Promise<Book[]> {
  if (!query.trim()) return [];
  return addonEngine.searchMetadata(query);
}
