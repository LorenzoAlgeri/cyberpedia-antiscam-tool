/**
 * useSpeechSynthesis — Web Speech API TTS hook.
 *
 * Prefers Italian voice (it-IT), falls back to default.
 * Handles Chrome bug where voices aren't available synchronously.
 * Cleans up on unmount.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechSynthesisReturn {
  /** Speak the given text, cancelling any ongoing speech. */
  speak: (text: string, id: string) => void;
  /** Stop any ongoing speech. */
  stop: () => void;
  /** Whether speech is currently playing. */
  isSpeaking: boolean;
  /** ID of the message currently being spoken. */
  speakingId: string | null;
  /** Whether TTS is supported in this browser. */
  isSupported: boolean;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices — handle Chrome async loading via onvoiceschanged
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) setVoices(available);
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported]);

  // Find preferred Italian voice
  const getItalianVoice = useCallback((): SpeechSynthesisVoice | undefined => {
    return (
      voices.find((v) => v.lang === 'it-IT') ??
      voices.find((v) => v.lang.startsWith('it'))
    );
  }, [voices]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setSpeakingId(null);
  }, [isSupported]);

  const speak = useCallback(
    (text: string, id: string) => {
      if (!isSupported) return;

      // Cancel any ongoing speech first
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'it-IT';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      const italianVoice = getItalianVoice();
      if (italianVoice) utterance.voice = italianVoice;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingId(id);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingId(null);
        utteranceRef.current = null;
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingId(null);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, getItalianVoice],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return { speak, stop, isSpeaking, speakingId, isSupported };
}
