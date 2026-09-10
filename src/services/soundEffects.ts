/**
 * Audio Engine for TV Remote & Netflix Feedback
 * Uses Web Audio API for zero-latency, lightweight synthesized audio.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  localStorage.setItem('vidlink_sound_effects', String(enabled));
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('vidlink_sound_effects');
  return saved === null ? true : saved === 'true';
}

/**
 * Subtle high-frequency micro-click on D-pad navigation
 */
export function playNavClick() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch {}
}

/**
 * Deep, satisfying confirmation thud on pressing Enter / Select
 */
export function playSelectSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(85, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {}
}

/**
 * Authentic Netflix-style "Ta-Dum" cinematic intro sound
 */
export function playTaDum() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First drum hit ("Ta")
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(130, now);
    osc1.frequency.exponentialRampToValueAtTime(55, now + 0.22);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    // Second cinematic swell & resolve ("DUMMMM")
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();

    const t2 = now + 0.16;

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(98, t2);
    osc2.frequency.exponentialRampToValueAtTime(45, t2 + 0.85);

    gain2.gain.setValueAtTime(0.001, t2);
    gain2.gain.linearRampToValueAtTime(0.22, t2 + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.95);

    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(196, t2);
    osc3.frequency.exponentialRampToValueAtTime(90, t2 + 0.85);

    gain3.gain.setValueAtTime(0.001, t2);
    gain3.gain.linearRampToValueAtTime(0.12, t2 + 0.08);
    gain3.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.95);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);

    osc2.start(t2);
    osc2.stop(t2 + 0.95);
    osc3.start(t2);
    osc3.stop(t2 + 0.95);
  } catch {}
}
