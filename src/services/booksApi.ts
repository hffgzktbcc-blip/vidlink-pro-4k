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
  
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&printType=books`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.items) return [];
    
    return data.items.map((item: any) => ({
      id: item.id,
      title: item.volumeInfo.title || 'Unknown Title',
      author: item.volumeInfo.authors ? item.volumeInfo.authors[0] : 'Unknown Author',
      description: item.volumeInfo.description || '',
      coverUrl: item.volumeInfo.imageLinks ? (item.volumeInfo.imageLinks.thumbnail || item.volumeInfo.imageLinks.smallThumbnail).replace('http:', 'https:') : null,
      publishedYear: item.volumeInfo.publishedDate ? item.volumeInfo.publishedDate.substring(0, 4) : 'Unknown',
    }));
  } catch (error) {
    console.error('Error fetching books:', error);
    return [];
  }
}
