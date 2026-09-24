import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Loader2, AlertTriangle, Headphones } from 'lucide-react';
import { searchBooks, type Book } from '../services/booksApi';
import { resolveAudiobook, type AudiobookStream } from '../services/audiobooksResolver';
import { AudiobookPlayer } from './AudiobookPlayer';
import { playSelectSound } from '../services/soundEffects';

export const AudiobooksPage: React.FC = () => {
  
  const [books, setBooks] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveProgress, setResolveProgress] = useState('');
  const [resolveError, setResolveError] = useState<string | null>(null);
  
  const [streams, setStreams] = useState<AudiobookStream[] | null>(null);

  // Initial load
  useEffect(() => {
    handleSearch('Stephen King');
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setBooks([]);
    try {
      const results = await searchBooks(searchQuery);
      setBooks(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookClick = async (book: Book) => {
    playSelectSound();
    setSelectedBook(book);
    setIsResolving(true);
    setResolveProgress('Initializing...');
    setResolveError(null);

    try {
      const audioStreams = await resolveAudiobook(book.title, book.author, (msg) => {
        setResolveProgress(msg);
      });
      setStreams(audioStreams);
    } catch (error: any) {
      setResolveError(error.message || 'Failed to resolve audiobook.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 relative min-h-screen">
      {/* Header & Search */}
      <div className="sticky top-0 z-20 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5 p-4 sm:p-6 sm:pt-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Headphones className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-white">Audiobooks</h1>
          </div>

          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for titles, authors, or genres..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e.currentTarget.value);
                  e.currentTarget.blur();
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-400 gap-4">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="font-medium text-gray-400">Searching global libraries...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {books.map((book) => (
              <div 
                key={book.id} 
                onClick={() => handleBookClick(book)}
                className="group cursor-pointer relative"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 border border-white/10 mb-3 shadow-lg group-hover:scale-[1.02] group-hover:shadow-indigo-500/20 transition-all duration-300">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                      <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-xs">{book.title}</span>
                    </div>
                  )}
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                      <Headphones className="w-6 h-6" />
                    </div>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">{book.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-1">{book.author}</p>
                <p className="text-[10px] text-gray-500 mt-1">{book.publishedYear}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolving Modal */}
      {(isResolving || resolveError) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e101a] border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            {resolveError ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-white mb-2">Not Found</h3>
                <p className="text-sm text-gray-400 mb-6">{resolveError}</p>
                <button 
                  onClick={() => { setResolveError(null); setSelectedBook(null); }}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <h3 className="text-lg font-black text-white mb-2">Unlocking Audiobook</h3>
                <p className="text-sm text-gray-400 mb-2">{selectedBook?.title}</p>
                <p className="text-xs font-mono text-indigo-400 bg-indigo-950/50 py-2 rounded-lg">{resolveProgress}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Player */}
      {streams && selectedBook && (
        <AudiobookPlayer 
          book={selectedBook}
          streams={streams}
          onClose={() => setStreams(null)}
        />
      )}
    </div>
  );
};
