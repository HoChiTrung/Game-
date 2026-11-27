type SfxName =
  | 'hoe'
  | 'water'
  | 'harvest'
  | 'swing'
  | 'hit'
  | 'crit'
  | 'hurt'
  | 'chest'
  | 'levelup'
  | 'boss_roar'
  | 'campfire'
  | 'click'
  | 'error'
  | 'dash'
  | 'nova';

class AudioManager {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopSpeech();
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  playSfx(name: SfxName): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const jitter = 0.94 + Math.random() * 0.12;

    const tone = (
      freqStart: number,
      freqEnd: number,
      duration: number,
      type: OscillatorType = 'square',
      volume = 0.08,
      delay = 0
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart * jitter, now + delay);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd * jitter), now + delay + duration);
      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(volume, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.02);
    };

    switch (name) {
      case 'hoe':
        tone(170, 95, 0.09, 'triangle', 0.1);
        break;
      case 'water':
        tone(420, 680, 0.08, 'sine', 0.07);
        tone(560, 820, 0.09, 'sine', 0.06, 0.06);
        break;
      case 'harvest':
        tone(523, 659, 0.09, 'square', 0.06);
        tone(659, 784, 0.11, 'square', 0.06, 0.08);
        break;
      case 'swing':
        tone(340, 140, 0.08, 'triangle', 0.08);
        break;
      case 'hit':
        tone(210, 85, 0.1, 'sawtooth', 0.09);
        break;
      case 'crit':
        tone(523, 784, 0.09, 'square', 0.09);
        tone(784, 1046, 0.16, 'square', 0.1, 0.07);
        tone(220, 110, 0.14, 'sawtooth', 0.09, 0.02);
        break;
      case 'hurt':
        tone(190, 75, 0.18, 'sawtooth', 0.11);
        break;
      case 'chest':
        tone(440, 554, 0.1, 'square', 0.07);
        tone(554, 659, 0.1, 'square', 0.07, 0.09);
        tone(659, 880, 0.18, 'square', 0.08, 0.18);
        break;
      case 'levelup':
        tone(523, 523, 0.1, 'square', 0.07, 0);
        tone(659, 659, 0.1, 'square', 0.07, 0.09);
        tone(784, 784, 0.1, 'square', 0.07, 0.18);
        tone(1046, 1046, 0.24, 'square', 0.09, 0.27);
        break;
      case 'boss_roar':
        tone(140, 58, 0.42, 'sawtooth', 0.13);
        tone(95, 48, 0.48, 'square', 0.09, 0.06);
        break;
      case 'campfire':
        tone(392, 494, 0.14, 'triangle', 0.07);
        tone(494, 587, 0.18, 'triangle', 0.07, 0.12);
        break;
      case 'click':
        tone(620, 740, 0.04, 'triangle', 0.05);
        break;
      case 'error':
        tone(220, 150, 0.14, 'square', 0.08);
        break;
      case 'dash':
        tone(290, 560, 0.09, 'triangle', 0.08);
        break;
      case 'nova':
        tone(330, 880, 0.16, 'square', 0.1, 0);
        tone(523, 1046, 0.22, 'triangle', 0.11, 0.06);
        tone(196, 98, 0.25, 'sawtooth', 0.09, 0.02);
        break;
    }
  }

  speakEnglish(text: string, rate = 0.94): void {
    if (this.muted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      utterance.pitch = 1.02;
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.lang === 'en-US' && /natural|google|samantha|aria/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith('en-US')) ||
        voices.find((v) => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Safe fallback if browser blocks speech synthesis
    }
  }

  stopSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }
}

export const audioManager = new AudioManager();
