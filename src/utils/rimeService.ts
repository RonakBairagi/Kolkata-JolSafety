/**
 * Voice Speech Synthesis Service for Kolkata JolSafety Voice Assistant
 * 
 * Provides:
 * 1. Authentic Native Kolkata Bengali accent (bn-IN) speaking naturally like a native Bengali person.
 * 2. Authentic Indian English accent (en-IN).
 * 3. Authentic Indian Hindi accent (hi-IN).
 * 
 * Integrates high-fidelity native speaker neural audio streaming with seamless fallback
 * to Web Speech Synthesis API with strict regional voice filtering.
 */

export interface RimeSynthesisOptions {
  text: string;
  lang?: 'en' | 'bn' | 'hi';
  speaker?: string;
  modelId?: string;
  speedAlpha?: number;
}

export interface SpeechPlaybackCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

// Pre-load and cache browser speech synthesis voices to prevent empty array race conditions
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

/**
 * Splits long text into natural phrasal chunks (max ~150 chars)
 * respecting Bengali punctuation ('।'), sentence periods, and commas.
 */
function splitTextIntoSpeechChunks(text: string, maxLen = 150): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  // Split on Bengali full-stop '।', standard sentence endings, question marks, or newlines
  const segments = clean.split(/([।!?\n]+|\.\s+)/);
  const chunks: string[] = [];
  let current = '';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg) continue;
    if ((current + seg).length <= maxLen) {
      current += seg;
    } else {
      if (current.trim()) chunks.push(current.trim());
      if (seg.length <= maxLen) {
        current = seg;
      } else {
        // Subdivide along commas, colons, or word boundaries
        const words = seg.split(/([,;:]+|\s+)/);
        for (const w of words) {
          if ((current + w).length <= maxLen) {
            current += w;
          } else {
            if (current.trim()) chunks.push(current.trim());
            current = w;
          }
        }
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.length > 0);
}

class RimeVoiceService {
  private activeAudio: HTMLAudioElement | null = null;
  private isBrowserSpeaking = false;
  private currentAudioUrl: string | null = null;
  private isPlaybackCancelled = false;
  private currentLang: 'en' | 'bn' | 'hi' = 'en';

  /**
   * Retrieves active Rime API key from environment or local storage (if configured)
   */
  public getApiKey(): string {
    const envKey = import.meta.env.VITE_RIME_API_KEY || '';
    if (envKey) return envKey;
    try {
      return localStorage.getItem('kolkata_rime_api_key') || '';
    } catch {
      return '';
    }
  }

  public setApiKey(key: string): void {
    try {
      if (key) {
        localStorage.setItem('kolkata_rime_api_key', key.trim());
      } else {
        localStorage.removeItem('kolkata_rime_api_key');
      }
    } catch (e) {
      console.warn('Failed to store Rime API key:', e);
    }
  }

  public isRimeAvailable(): boolean {
    return Boolean(this.getApiKey());
  }

  /**
   * Speaks the text with:
   * - Bengali (bn): Authentic Kolkata native Bengali accent speaking like a real Bengali person.
   * - English (en): Authentic Indian English accent.
   * - Hindi (hi): Authentic Indian Hindi accent.
   */
  public async speak(
    text: string, 
    lang: 'en' | 'bn' | 'hi' = 'en', 
    callbacks?: SpeechPlaybackCallbacks
  ): Promise<{ engine: 'native_stream' | 'browser' }> {
    this.stop();
    this.currentLang = lang;
    this.isPlaybackCancelled = false;

    if (!text || !text.trim()) {
      callbacks?.onEnd?.();
      return { engine: 'native_stream' };
    }

    const cleanText = this.prepareTextForSpeech(text);
    if (!cleanText) {
      callbacks?.onEnd?.();
      return { engine: 'native_stream' };
    }

    // Determine target regional language tag
    // Bengali: 'bn-IN' (Real native Bengali speaker audio)
    // English: 'en-IN' (Indian English accent)
    // Hindi: 'hi-IN' (Indian Hindi accent)
    const targetLangCode = lang === 'bn' ? 'bn-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';

    // Split text into natural chunks for fluid, non-truncated playback
    const chunks = splitTextIntoSpeechChunks(cleanText, 150);
    if (chunks.length === 0) {
      callbacks?.onEnd?.();
      return { engine: 'native_stream' };
    }

    try {
      // 1. Primary engine: Play authentic native voice audio stream
      await this.playAudioChunksSequence(chunks, targetLangCode, lang, callbacks);
      return { engine: 'native_stream' };
    } catch (streamErr) {
      console.warn('Primary native audio playback failed, falling back to Web Speech Synthesis:', streamErr);
      if (!this.isPlaybackCancelled) {
        this.fallbackBrowserSpeech(cleanText, lang, callbacks);
      }
      return { engine: 'browser' };
    }
  }

  /**
   * Plays a sequence of audio chunks using high-fidelity native voice audio streams
   */
  private playAudioChunksSequence(
    chunks: string[],
    targetLangCode: string,
    lang: 'en' | 'bn' | 'hi',
    callbacks?: SpeechPlaybackCallbacks
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let currentIndex = 0;
      let hasStarted = false;

      const playNextChunk = async () => {
        if (this.isPlaybackCancelled) {
          this.activeAudio = null;
          resolve();
          return;
        }

        if (currentIndex >= chunks.length) {
          this.activeAudio = null;
          callbacks?.onEnd?.();
          resolve();
          return;
        }

        const chunk = chunks[currentIndex];
        currentIndex++;

        // Route through our high-fidelity regional TTS proxy (/api/tts)
        const ttsEndpoint = `/api/tts?text=${encodeURIComponent(chunk)}&lang=${encodeURIComponent(lang)}`;

        try {
          // Fetch audio blob first to bypass cross-origin / referer blocks cleanly
          const response = await fetch(ttsEndpoint);
          if (!response.ok) {
            throw new Error(`TTS server returned status ${response.status}`);
          }

          if (this.isPlaybackCancelled) {
            resolve();
            return;
          }

          const blob = await response.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          this.activeAudio = audio;
          this.currentAudioUrl = audioUrl;

          audio.oncanplay = () => {
            if (!hasStarted && !this.isPlaybackCancelled) {
              hasStarted = true;
              callbacks?.onStart?.();
            }
          };

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            this.activeAudio = null;
            this.currentAudioUrl = null;
            playNextChunk();
          };

          audio.onerror = (e) => {
            URL.revokeObjectURL(audioUrl);
            console.warn(`Error playing chunk ${currentIndex} for lang ${targetLangCode}:`, e);
            this.activeAudio = null;
            this.currentAudioUrl = null;
            if (currentIndex === 1 && !hasStarted) {
              reject(new Error('Audio stream unavailable'));
            } else {
              playNextChunk();
            }
          };

          await audio.play();
        } catch (playError) {
          console.warn('Audio play() error:', playError);
          this.activeAudio = null;
          if (currentIndex === 1 && !hasStarted) {
            reject(playError);
          } else {
            playNextChunk();
          }
        }
      };

      playNextChunk();
    });
  }

  /**
   * Browser SpeechSynthesis fallback strictly configured with native regional voices
   * and authentic speech cadence.
   */
  private fallbackBrowserSpeech(
    text: string,
    lang: 'en' | 'bn' | 'hi',
    callbacks?: SpeechPlaybackCallbacks
  ): void {
    if (!('speechSynthesis' in window)) {
      callbacks?.onError?.(new Error('Speech synthesis not supported in this browser'));
      callbacks?.onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = cachedVoices.length > 0 
        ? cachedVoices 
        : window.speechSynthesis.getVoices();

      if (lang === 'bn') {
        // Bengali: Real Bengali speaker voice with calm, articulate natural cadence
        utterance.lang = 'bn-IN';
        utterance.rate = 0.92;
        utterance.pitch = 1.0;

        // Strictly prioritize authentic Bengali voices and explicitly reject English voices
        const bnVoice = 
          voices.find(v => (v.lang === 'bn-IN' || v.lang === 'bn_IN') && !v.name.toLowerCase().includes('english')) ||
          voices.find(v => (v.lang === 'bn-BD' || v.lang === 'bn_BD') && !v.name.toLowerCase().includes('english')) ||
          voices.find(v => (v.name.toLowerCase().includes('bangla') || v.name.toLowerCase().includes('bengali') || v.name.includes('বাংলা') || v.name.toLowerCase().includes('bashkar') || v.name.toLowerCase().includes('tapan')) && !v.name.toLowerCase().includes('english')) ||
          voices.find(v => v.lang.startsWith('bn'));

        if (bnVoice) {
          utterance.voice = bnVoice;
        } else {
          // If the client OS has NO Bengali voice installed, NEVER let an English voice mangle Bengali text.
          console.warn('No native Bengali voice found in browser SpeechSynthesis.');
          callbacks?.onError?.(new Error('No native Bengali voice available in browser speech synthesis.'));
          callbacks?.onEnd?.();
          return;
        }
      } else if (lang === 'hi') {
        // Hindi: Authentic Indian Hindi voice
        utterance.lang = 'hi-IN';
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        const hiVoice = 
          voices.find(v => (v.lang === 'hi-IN' || v.lang === 'hi_IN')) ||
          voices.find(v => (v.name.toLowerCase().includes('hindi') || v.name.includes('हिन्दी') || v.name.toLowerCase().includes('hemant') || v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('madhur'))) ||
          voices.find(v => v.lang.startsWith('hi'));
        if (hiVoice) utterance.voice = hiVoice;
      } else {
        // English: Authentic Indian English accent
        utterance.lang = 'en-IN';
        utterance.rate = 0.98;
        utterance.pitch = 1.0;

        // Strictly prioritize Indian English voices
        const enVoice = 
          voices.find(v => v.lang === 'en-IN' || v.lang === 'en_IN') ||
          voices.find(v => v.lang.startsWith('en') && (
            v.name.toLowerCase().includes('india') ||
            v.name.toLowerCase().includes('ravi') ||
            v.name.toLowerCase().includes('heera') ||
            v.name.toLowerCase().includes('veena') ||
            v.name.toLowerCase().includes('rishi') ||
            v.name.toLowerCase().includes('kavya') ||
            v.name.toLowerCase().includes('neerja') ||
            v.name.toLowerCase().includes('prabhat')
          )) ||
          voices.find(v => v.lang.startsWith('en-IN')) ||
          voices.find(v => v.lang.startsWith('en'));

        if (enVoice) utterance.voice = enVoice;
      }

      this.isBrowserSpeaking = true;

      utterance.onstart = () => {
        callbacks?.onStart?.();
      };

      utterance.onend = () => {
        this.isBrowserSpeaking = false;
        callbacks?.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.isBrowserSpeaking = false;
        callbacks?.onError?.(e);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      this.isBrowserSpeaking = false;
      callbacks?.onError?.(e);
      callbacks?.onEnd?.();
    }
  }

  /**
   * Stops any currently playing audio stream or speech utterance
   */
  public stop(): void {
    this.isPlaybackCancelled = true;

    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.activeAudio = null;
    }

    if (this.currentAudioUrl) {
      try {
        URL.revokeObjectURL(this.currentAudioUrl);
      } catch {
        // ignore
      }
      this.currentAudioUrl = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.isBrowserSpeaking = false;
  }

  public isSpeaking(): boolean {
    return Boolean(this.activeAudio && !this.activeAudio.paused) || this.isBrowserSpeaking;
  }

  /**
   * Strips markdown, emojis, URLs, and cleans text for clear audio pronunciation
   */
  private prepareTextForSpeech(text: string): string {
    return text
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[*_#`~]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const rimeService = new RimeVoiceService();
