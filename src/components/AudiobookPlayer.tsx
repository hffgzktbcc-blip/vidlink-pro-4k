import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, X, Volume2, 
  FastForward, Rewind, ListMusic
} from 'lucide-react';
import type { Book } from '../services/booksApi';
import type { AudiobookStream } from '../services/audiobooksResolver';

interface AudiobookPlayerProps {
  book: Book;
  streams: AudiobookStream[];
  onClose: () => void;
}

export const AudiobookPlayer: React.FC<AudiobookPlayerProps> = ({ book, streams, onClose }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showTracklist, setShowTracklist] = useState(false);

  const currentStream = streams[currentTrackIndex];

  // Initialize Audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentStream.url;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().catch(e => console.error('Audio play error:', e));
      setIsPlaying(true);
    }
  }, [currentTrackIndex]);

  // Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => {
      if (currentTrackIndex < streams.length - 1) {
        setCurrentTrackIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentTrackIndex, streams.length]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime += seconds;
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[60] bg-[#0e101a]/95 backdrop-blur-3xl flex flex-col animate-in fade-in zoom-in-95 duration-300">
      <audio ref={audioRef} />

      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <button onClick={onClose} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all">
          <X className="w-6 h-6" />
        </button>
        {streams.length > 1 && (
          <button onClick={() => setShowTracklist(!showTracklist)} className={`p-3 rounded-full transition-all ${showTracklist ? 'bg-indigo-600 text-white' : 'bg-white/5 hover:bg-white/10 text-white'}`}>
            <ListMusic className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Main Player Area */}
        <div className={`flex-1 flex flex-col items-center justify-center p-6 sm:p-12 transition-all duration-500 ${showTracklist ? 'md:mr-80' : ''}`}>
          
          {/* Spinning Cover Art */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 mb-12 shadow-2xl rounded-full overflow-hidden border-4 border-white/5 bg-black">
            {book.coverUrl ? (
              <img 
                src={book.coverUrl.replace('zoom=1', 'zoom=3')} 
                alt={book.title} 
                className={`w-full h-full object-cover transition-transform duration-[20s] linear ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`}
                style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
              />
            ) : (
              <div className="w-full h-full bg-indigo-900 flex items-center justify-center text-indigo-300">
                <Volume2 className="w-24 h-24" />
              </div>
            )}
            {/* Vinyl Record Center Hole */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-12 sm:h-12 bg-[#0e101a] rounded-full border border-white/10"></div>
          </div>

          {/* Book Info */}
          <div className="text-center w-full max-w-md px-4 mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 line-clamp-2">{book.title}</h2>
            <p className="text-lg text-indigo-300 font-medium">{book.author}</p>
            {streams.length > 1 && (
              <p className="text-sm text-gray-400 mt-2 font-mono">Track {currentTrackIndex + 1} of {streams.length}</p>
            )}
          </div>

          {/* Scrubber */}
          <div className="w-full max-w-2xl px-6 mb-10">
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono text-gray-400 w-12 text-right">{formatTime(currentTime)}</span>
              <div 
                className="relative flex-1 h-2 sm:h-3 bg-white/10 rounded-full cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  if (audioRef.current && duration > 0) {
                    audioRef.current.currentTime = ratio * duration;
                  }
                }}
              >
                <div className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${progressPercent}% - 8px)` }}></div>
              </div>
              <span className="text-sm font-mono text-gray-400 w-12">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            <button onClick={cycleSpeed} className="w-12 text-center text-sm font-bold text-gray-400 hover:text-white transition-colors">
              {playbackSpeed}x
            </button>
            
            <button onClick={() => skip(-15)} className="p-3 text-gray-300 hover:text-white transition-colors" title="Rewind 15s">
              <Rewind className="w-8 h-8" />
            </button>

            <button onClick={togglePlay} className="p-6 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              {isPlaying ? <Pause className="w-8 h-8 fill-black" /> : <Play className="w-8 h-8 fill-black ml-1" />}
            </button>

            <button onClick={() => skip(15)} className="p-3 text-gray-300 hover:text-white transition-colors" title="Fast Forward 15s">
              <FastForward className="w-8 h-8" />
            </button>

            <div className="w-12"></div> {/* Spacer for symmetry */}
          </div>
        </div>

        {/* Tracklist Sidebar (For multi-file audiobooks) */}
        {showTracklist && streams.length > 1 && (
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-black/50 border-l border-white/10 backdrop-blur-xl flex flex-col animate-in slide-in-from-right">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Tracks</h3>
              <p className="text-xs text-gray-400 mt-1">{streams.length} parts available</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {streams.map((stream, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTrackIndex(idx)}
                  className={`w-full text-left p-4 rounded-xl flex items-center gap-3 transition-colors ${
                    idx === currentTrackIndex ? 'bg-indigo-600 text-white' : 'hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <div className="w-8 text-center text-sm font-mono opacity-50">{idx + 1}</div>
                  <div className="flex-1 truncate text-sm font-medium">{stream.filename}</div>
                  {idx === currentTrackIndex && <Volume2 className="w-4 h-4 animate-pulse" />}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
