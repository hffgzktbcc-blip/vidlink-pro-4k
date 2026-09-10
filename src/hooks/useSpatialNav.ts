import { useEffect, useState, useCallback, useRef } from 'react';
import { playNavClick, playSelectSound } from '../services/soundEffects';

type Direction = 'up' | 'down' | 'left' | 'right';

interface SpatialNavOptions {
  activeModalOpen?: boolean;
  onBack?: () => void;
}

export function useSpatialNav(options: SpatialNavOptions = {}) {
  const { onBack } = options;
  const [isTvMode, setIsTvMode] = useState<boolean>(() => {
    return localStorage.getItem('vidlink_tv_mode') === 'true';
  });

  const activeElementRef = useRef<HTMLElement | null>(null);

  const toggleTvMode = useCallback(() => {
    setIsTvMode(prev => {
      const next = !prev;
      localStorage.setItem('vidlink_tv_mode', String(next));
      if (next) {
        document.body.classList.add('tv-mode');
      } else {
        document.body.classList.remove('tv-mode');
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (isTvMode) {
      document.body.classList.add('tv-mode');
    } else {
      document.body.classList.remove('tv-mode');
    }
  }, [isTvMode]);

  const getFocusableCandidates = useCallback((): HTMLElement[] => {
    let searchRoot: HTMLElement | Document = document;
    const openModal = document.querySelector<HTMLElement>('[data-tv-modal="true"]');
    if (openModal) {
      searchRoot = openModal;
    }

    const selector = [
      '[data-tv-focus="true"]',
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      '[tabindex="0"]',
    ].join(', ');

    const nodes = Array.from(searchRoot.querySelectorAll<HTMLElement>(selector));

    return nodes.filter(el => {
      if (el.getAttribute('aria-hidden') === 'true') return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  }, []);

  const findBestCandidate = useCallback(
    (current: HTMLElement, direction: Direction, candidates: HTMLElement[]): HTMLElement | null => {
      const currentRect = current.getBoundingClientRect();
      const currentCenter = {
        x: currentRect.left + currentRect.width / 2,
        y: currentRect.top + currentRect.height / 2,
      };

      let bestCandidate: HTMLElement | null = null;
      let minDistance = Infinity;

      for (const candidate of candidates) {
        if (candidate === current) continue;

        const rect = candidate.getBoundingClientRect();
        const center = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };

        const dx = center.x - currentCenter.x;
        const dy = center.y - currentCenter.y;

        let isValidDirection = false;
        let primaryDist = 0;
        let secondaryDist = 0;

        switch (direction) {
          case 'left':
            isValidDirection = dx < -5;
            primaryDist = Math.abs(dx);
            secondaryDist = Math.abs(dy);
            break;
          case 'right':
            isValidDirection = dx > 5;
            primaryDist = Math.abs(dx);
            secondaryDist = Math.abs(dy);
            break;
          case 'up':
            isValidDirection = dy < -5;
            primaryDist = Math.abs(dy);
            secondaryDist = Math.abs(dx);
            break;
          case 'down':
            isValidDirection = dy > 5;
            primaryDist = Math.abs(dy);
            secondaryDist = Math.abs(dx);
            break;
        }

        if (!isValidDirection) continue;

        // Weight primary axis distance heavily; penalize off-axis candidates
        const distance = primaryDist + secondaryDist * 2.2;

        if (distance < minDistance) {
          minDistance = distance;
          bestCandidate = candidate;
        }
      }

      return bestCandidate;
    },
    []
  );

  const focusElement = useCallback((element: HTMLElement) => {
    activeElementRef.current = element;
    element.focus({ preventScroll: true });

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // When virtual cursor is active, completely suspend spatial navigation to stop highlighting background tabs
      if (document.body.classList.contains('cursor-active')) {
        return;
      }

      const key = e.key;
      const keyCode = e.keyCode;

      // Handle TV Back key
      if (key === 'Escape' || key === 'GoBack' || keyCode === 4 || keyCode === 10009) {
        if (onBack) {
          e.preventDefault();
          onBack();
          return;
        }
      }

      // Handle Android TV D-Pad OK / Center button click on focused card or button
      const isOkButton = key === 'Enter' || key === 'Select' || key === 'Accept' || keyCode === 23 || keyCode === 13;
      if (isOkButton && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
        const current = (document.activeElement as HTMLElement) || activeElementRef.current;
        if (current) {
          e.preventDefault();
          playSelectSound();
          current.click();
          return;
        }
      }

      let direction: Direction | null = null;
      if (key === 'ArrowUp' || keyCode === 19) direction = 'up';
      else if (key === 'ArrowDown' || keyCode === 20) direction = 'down';
      else if (key === 'ArrowLeft' || keyCode === 21) direction = 'left';
      else if (key === 'ArrowRight' || keyCode === 22) direction = 'right';

      if (!direction) return;

      if (!isTvMode) {
        setIsTvMode(true);
        localStorage.setItem('vidlink_tv_mode', 'true');
        document.body.classList.add('tv-mode');
      }

      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        if (direction === 'left' || direction === 'right') {
          return;
        }
      }

      const candidates = getFocusableCandidates();
      if (candidates.length === 0) return;

      const current = (document.activeElement as HTMLElement) || activeElementRef.current;

      if (!current || !candidates.includes(current)) {
        e.preventDefault();
        playNavClick();
        focusElement(candidates[0]);
        return;
      }

      const next = findBestCandidate(current, direction, candidates);
      if (next) {
        e.preventDefault();
        playNavClick();
        focusElement(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [findBestCandidate, focusElement, getFocusableCandidates, isTvMode, onBack]);

  return {
    isTvMode,
    toggleTvMode,
    focusElement,
  };
}
