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
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.docs) return [];
    
    return data.docs.map((item: any) => ({
      id: item.key,
      title: item.title || 'Unknown Title',
      author: item.author_name ? item.author_name[0] : 'Unknown Author',
      description: item.first_sentence ? (typeof item.first_sentence === 'string' ? item.first_sentence : item.first_sentence[0]) : '',
      coverUrl: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : null,
      publishedYear: item.first_publish_year ? item.first_publish_year.toString() : 'Unknown',
    }));
  } catch (error) {
    console.error('Error fetching books from OpenLibrary:', error);
    return [];
  }
}
