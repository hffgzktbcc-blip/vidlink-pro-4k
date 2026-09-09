import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MousePointer2 } from 'lucide-react';

declare global {
  interface Window {
    AndroidTV?: {
      clickAt: (x: number, y: number) => void;
    };
  }
}

interface VirtualCursorProps {
  isEnabled: boolean;
  onToggle: () => void;
}

export const VirtualCursor: React.FC<VirtualCursorProps> = ({ isEnabled, onToggle }) => {
  const [pos, setPos] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 640,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 360,
  });
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    setIsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 6000);
  }, []);

  const dispatchVirtualClick = useCallback((x: number, y: number) => {
    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 200);

    // 1. Android Native WebView Touch Injection (pierces cross-origin iframes on Android TV!)
    if (window.AndroidTV?.clickAt) {
      const scale = window.devicePixelRatio || 1;
      window.AndroidTV.clickAt(x * scale, y * scale);
      return;
    }

    // 2. Web Browser Fallback: find element and dispatch synthetic mouse/touch events
    const el = document.elementFromPoint(x, y);
    if (el) {
      // If clicking directly on or inside an iframe, give it immediate DOM focus
      if (el instanceof HTMLIFrameElement || el.tagName === 'IFRAME') {
        (el as HTMLIFrameElement).focus();
      }

      const opts = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
      };
      el.dispatchEvent(new MouseEvent('mousedown', opts));
      el.dispatchEvent(new MouseEvent('mouseup', opts));
      el.dispatchEvent(new MouseEvent('click', opts));
      if (el instanceof HTMLElement) {
        el.click();
      }
    }
  }, []);

  // Manage body cursor-active class and blur any highlighted tabs
  useEffect(() => {
    if (isEnabled) {
      document.body.classList.add('cursor-active');
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    } else {
      document.body.classList.remove('cursor-active');
    }
    return () => {
      document.body.classList.remove('cursor-active');
    };
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;

    let step = 32;
    let keyHoldCount = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      // Toggle cursor mode hotkey 'c' or 'C'
      if (key.toLowerCase() === 'c' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onToggle();
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        resetHideTimer();

        keyHoldCount++;
        // Acceleration when holding down arrow
        const currentStep = keyHoldCount > 4 ? step * 1.7 : step;

        setPos(prev => {
          let nx = prev.x;
          let ny = prev.y;

          if (key === 'ArrowUp') ny = Math.max(20, prev.y - currentStep);
          if (key === 'ArrowDown') ny = Math.min(window.innerHeight - 20, prev.y + currentStep);
          if (key === 'ArrowLeft') nx = Math.max(20, prev.x - currentStep);
          if (key === 'ArrowRight') nx = Math.min(window.innerWidth - 20, prev.x + currentStep);

          return { x: nx, y: ny };
        });
      } else if (key === 'Enter' || key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        resetHideTimer();
        setPos(curr => {
          dispatchVirtualClick(curr.x, curr.y);
          return curr;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        keyHoldCount = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, [isEnabled, onToggle, dispatchVirtualClick, resetHideTimer]);

  if (!isEnabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] select-none">
      {/* Floating Virtual Cursor Indicator */}
      <div
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          transition: 'transform 0.04s ease-out',
        }}
        className={`absolute -top-3.5 -left-3.5 flex items-center justify-center transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Outer Glowing Ring */}
        <div
          className={`relative w-8 h-8 rounded-full border-2 border-indigo-400 flex items-center justify-center shadow-lg transition-transform duration-100 ${
            isClicking
              ? 'scale-75 bg-indigo-500/80 shadow-indigo-500'
              : 'scale-100 bg-black/40 shadow-indigo-500/50 backdrop-blur-sm'
          }`}
        >
          {/* Target Center Dot */}
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-75" />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
        </div>

        {/* Click Ripple Wave */}
        {isClicking && (
          <div className="absolute w-12 h-12 rounded-full border-2 border-amber-400 animate-ping opacity-90 pointer-events-none" />
        )}
      </div>

      {/* Floating Helper Pill in corner */}
      <div className="pointer-events-auto absolute top-4 right-4 z-[9999]">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black border border-indigo-500/50 text-indigo-300 text-xs font-bold shadow-2xl backdrop-blur-md transition-all"
        >
          <MousePointer2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>TV Cursor: ON (D-Pad Moves • OK Clicks)</span>
          <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[10px]">
            Exit (C)
          </span>
        </button>
      </div>
    </div>
  );
};
