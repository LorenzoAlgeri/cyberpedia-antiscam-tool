/**
 * useSpeechRecognition — Web Speech API STT hook.
 *
 * Works on Chrome/Edge (webkitSpeechRecognition). Gracefully degrades
 * on unsupported browsers (isSupported = false).
 * Language: it-IT. Single phrase mode (continuous = false).
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Type declarations for the Web Speech API (not in all lib.dom builds)
declare global {
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }

  interface SpeechRecognitionInstance extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onstart: (() => void) | null;
  }

  interface SpeechRecognitionConstructor {
    new (): SpeechRecognitionInstance;
  }

  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseSpeechRecognitionReturn {
  /** Start listening for speech. */
  startListening: () => void;
  /** Stop listening. */
  stopListening: () => void;
  /** Whether currently listening. */
  isListening: boolean;
  /** The recognised transcript (final result). */
  transcript: string;
  /** Whether STT is supported (Chrome/Edge mainly). */
  isSupported: boolean;
  /** Reset transcript to empty string. */
  resetTranscript: () => void;
}

function getSpeechRecognitionClass(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const SRClass = getSpeechRecognitionClass();
  const isSupported = SRClass != null;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!SRClass) return;

    // Stop any existing instance
    recognitionRef.current?.abort();

    const recognition = new SRClass();
    recognition.lang = 'it-IT';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.isFinal) {
          finalTranscript += result[0]?.transcript ?? '';
        } else {
          interimTranscript += result?.[0]?.transcript ?? '';
        }
      }

      // Show interim results while listening, final when done
      if (finalTranscript) {
        setTranscript(finalTranscript);
      } else if (interimTranscript) {
        setTranscript(interimTranscript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'aborted' and 'no-speech' are non-critical
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.warn('[useSpeechRecognition] error:', event.error);
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [SRClass]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    startListening,
    stopListening,
    isListening,
    transcript,
    isSupported,
    resetTranscript,
  };
}
