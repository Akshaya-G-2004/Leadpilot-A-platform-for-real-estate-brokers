// src/lib/speech.ts
// Client-side Web Speech Synthesis helper with en-IN voice preference and fallback.

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Finds the best voice: prefers en-IN, then en-GB, en-US, or first available english voice.
 */
function getBestEnglishVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();

  // 1. Try Indian English
  const enIn = voices.find((v) => v.lang.toLowerCase().includes("en-in"));
  if (enIn) return enIn;

  // 2. Try any English voice
  const anyEn = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  if (anyEn) return anyEn;

  return voices[0] || null;
}

export function playAudioBrief(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): () => void {
  if (!isSpeechSupported()) {
    onError?.(new Error("Speech synthesis not supported in this browser"));
    return () => {};
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05; // slightly punchy pace for ~15 sec brief
  utterance.pitch = 1.0;

  const voice = getBestEnglishVoice();
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (e) => onError?.(e);

  window.speechSynthesis.speak(utterance);

  // Return a cancel function
  return () => {
    window.speechSynthesis.cancel();
    onEnd?.();
  };
}

export function stopAudioBrief(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

