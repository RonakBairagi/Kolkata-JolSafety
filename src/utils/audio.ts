// Acoustic distress beacon using Web Audio API for monsoon low-visibility search & rescue
class EmergencySoundBeacon {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: any = null;

  public start() {
    if (this.isPlaying) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      this.audioCtx = new AudioContextClass();
      this.isPlaying = true;

      // Create sweeping emergency siren pitch (800Hz to 1200Hz back and forth)
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      this.gainNode.connect(this.audioCtx.destination);

      let toggle = false;
      const playPulse = () => {
        if (!this.audioCtx || !this.isPlaying) return;
        const osc = this.audioCtx.createOscillator();
        osc.type = 'sawtooth';
        const now = this.audioCtx.currentTime;
        const freq = toggle ? 1046.5 : 783.99; // C6 and G5 high-visibility marine pitch
        toggle = !toggle;
        osc.frequency.setValueAtTime(freq, now);
        osc.connect(this.gainNode!);
        osc.start(now);
        osc.stop(now + 0.35);
      };

      playPulse();
      this.intervalId = setInterval(playPulse, 450);
    } catch (e) {
      console.warn('AudioContext not allowed or not supported:', e);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {
        // ignore
      }
      this.audioCtx = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const emergencyBeacon = new EmergencySoundBeacon();
