/**
 * Web Audio API Synthesizer untuk Suara Ketukan Tasbih Digital
 * Tanpa file audio eksternal — latensi instan (~1ms) dan bekerja offline.
 */

let sharedAudioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Memutar suara ketukan tasbih sesuai tipe pilihan:
 * - 'wood': Ketukan biji kayu tasbih organik & hangat
 * - 'soft': Nada tetes halus / kristal lembut
 * - 'click': Klik mekanis tasbih digital klasik
 */
export function playTasbihKnock(soundType = 'wood') {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (soundType === 'soft') {
    // Soft harmonic water-drop chime
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(784, now); // G5
    osc1.frequency.exponentialRampToValueAtTime(523.25, now + 0.065);
    osc2.frequency.setValueAtTime(1174.66, now); // D6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.09);
    osc2.stop(now + 0.09);
    return;
  }

  if (soundType === 'click') {
    // Crisp digital counter mechanical click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1450, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.022);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.26, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.032);
    return;
  }

  // Default: 'wood' — organic wooden tasbih bead knock
  // 1. Resonant woody body
  const bodyOsc = ctx.createOscillator();
  const bodyGain = ctx.createGain();
  bodyOsc.type = 'sine';
  bodyOsc.frequency.setValueAtTime(690, now);
  bodyOsc.frequency.exponentialRampToValueAtTime(210, now + 0.042);

  bodyGain.gain.setValueAtTime(0.001, now);
  bodyGain.gain.linearRampToValueAtTime(0.28, now + 0.003);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.052);

  bodyOsc.connect(bodyGain);
  bodyGain.connect(ctx.destination);
  bodyOsc.start(now);
  bodyOsc.stop(now + 0.056);

  // 2. Crisp wooden bead contact transient
  const tapOsc = ctx.createOscillator();
  const tapGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  tapOsc.type = 'triangle';
  tapOsc.frequency.setValueAtTime(1280, now);
  tapOsc.frequency.exponentialRampToValueAtTime(480, now + 0.018);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1100, now);
  filter.Q.setValueAtTime(2.4, now);

  tapGain.gain.setValueAtTime(0.001, now);
  tapGain.gain.linearRampToValueAtTime(0.22, now + 0.002);
  tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

  tapOsc.connect(filter);
  filter.connect(tapGain);
  tapGain.connect(ctx.destination);

  tapOsc.start(now);
  tapOsc.stop(now + 0.026);
}

/**
 * Memutar nada lembut penanda target dzikir tercapai (mis. 33 / 99 / 100)
 */
export function playTargetCompleteChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5 - E5 - G5

  notes.forEach((freq, idx) => {
    const start = now + idx * 0.09;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.34);
  });
}

/**
 * Memicu getaran haptik di perangkat seluler yang mendukung Vibration API
 */
export function triggerTasbihHaptic(isTargetReached = false) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }
  try {
    if (isTargetReached) {
      navigator.vibrate([45, 55, 90]);
    } else {
      navigator.vibrate(18);
    }
  } catch {
    // Abaikan jika browser membatasi Vibration API
  }
}
