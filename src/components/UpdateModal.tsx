import React, { useEffect, useRef } from 'react';
import { Download, Sparkles, X, Tv, Smartphone, ArrowRight, ShieldCheck } from 'lucide-react';
import { type AppReleaseInfo, startApkInstallation } from '../services/updateChecker';

interface UpdateModalProps {
  release: AppReleaseInfo;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ release, onClose }) => {
  const updateBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // Automatically focus the primary Update button on Android TV
    const timer = setTimeout(() => {
      updateBtnRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Remote Back button or Escape closes dialog
      if (e.key === 'Escape' || e.key === 'GoBack' || e.keyCode === 4 || e.keyCode === 10009) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [onClose]);

  const handleUpdate = () => {
    startApkInstallation(release.downloadUrl);
    onClose();
  };

  const handleMobileUpdate = () => {
    if (release.mobileDownloadUrl) {
      startApkInstallation(release.mobileDownloadUrl);
      onClose();
    }
  };

  return (
    <div
      data-tv-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0e101a] border border-indigo-500/40 p-6 sm:p-8 shadow-2xl shadow-indigo-600/30 flex flex-col gap-5">
        {/* Header with Version Badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white">Update Available!</h3>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[11px] font-black uppercase tracking-wider">
                  v{release.latestVersion}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Current: v{release.currentVersion} • New Release Ready
              </p>
            </div>
          </div>

          <button
            data-tv-focus="true"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-all"
            title="Dismiss (Esc / Back)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Release Highlights / Changelog */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-2">
          <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
            What's New in this Build:
          </span>
          <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line font-sans">
            {release.releaseNotes}
          </p>
        </div>

        {/* Security & Verification Note */}
        <div className="flex items-center gap-2 text-[11px] text-emerald-400">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Verified GitHub Release • Signed APK</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            ref={updateBtnRef}
            data-tv-focus="true"
            onClick={handleUpdate}
            className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold shadow-xl shadow-indigo-600/40 border border-indigo-400/50 flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            <Tv className="w-4 h-4 text-indigo-200" />
            <Download className="w-4 h-4" />
            <span>Update Now (TV APK)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {release.mobileDownloadUrl && release.mobileDownloadUrl !== release.downloadUrl && (
            <button
              data-tv-focus="true"
              onClick={handleMobileUpdate}
              className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-gray-200 text-sm font-bold border border-white/15 flex items-center justify-center gap-2 transition-all"
              title="Download Mobile APK"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Mobile</span>
            </button>
          )}

          <button
            data-tv-focus="true"
            onClick={onClose}
            className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-bold border border-white/10 transition-all"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};
