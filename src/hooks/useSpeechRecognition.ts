/**
 * useSpeechRecognition — Web Speech API STT hook.
 *
 * Works on Chrome/Edge (webkitSpeechRecognition). Gracefully degrades
 * on unsupported browsers (isSupported = false).
 * Language: it-IT. Single phrase mode (continuous = false).
 *
 * Safety: includes a 3s timeout — if the browser exposes the API class
 * but never fires onstart (common in WebViews / in-app browsers),
 * the user sees an error instead of silent failure.
 *
 * On permanent failures (service-not-allowed, not-allowed), the hook
 * sets isSupported=false to hide the button for the rest of the session.
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

/** Errors that mean the API will never work on this device/session. */
const PERMANENT_ERRORS = new Set([
  'not-allowed',
  'service-not-allowed',
  'language-not-supported',
]);

/** Map STT error codes to user-facing Italian messages. */
const STT_ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microfono non autorizzato. Usa il pulsante 🎙 sulla tastiera per dettare.',
  'service-not-allowed': 'Vocale non disponibile. Usa il pulsante 🎙 sulla tastiera per dettare.',
  'audio-capture': 'Microfono non disponibile. Verifica che non sia usato da un\'altra app.',
  'network': 'Errore di rete per il riconoscimento vocale. Verifica la connessione.',
  'language-not-supported': 'Lingua italiana non supportata. Usa il pulsante 🎙 sulla tastiera.',
};

interface UseSpeechRecognitionReturn {
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  error: string | null;
  resetTranscript: () => void;
}

function getSpeechRecognitionClass(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const SRClass = getSpeechRecognitionClass();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [permanentlyDisabled, setPermanentlyDisabled] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTextRef = useRef('');

  const isSupported = SRClass != null && !permanentlyDisabled;

  const clearStartTimeout = useCallback(() => {
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    finalTextRef.current = '';
  }, []);

  const stopListening = useCallback(() => {
    clearStartTimeout();
    recognitionRef.current?.stop();
    setIsListening(false);
  }, [clearStartTimeout]);

  const startListening = useCallback(() => {
    if (!SRClass || permanentlyDisabled) return;

    setError(null);
    finalTextRef.current = '';
    clearStartTimeout();
    recognitionRef.current?.abort();

    const recognition = new SRClass();
    recognition.lang = 'it-IT';
    recognition.continuous = false;
    recognition.interimResults = true;

    // Optimistic UI — show listening state immediately
    setIsListening(true);

    // Safety timeout: if nothing fires within 3s, the API is dead
    startTimeoutRef.current = setTimeout(() => {
      startTimeoutRef.current = null;
      if (recognitionRef.current === recognition) {
        recognition.abort();
        recognitionRef.current = null;
        setIsListening(false);
        setPermanentlyDisabled(true);
        setError('Vocale non disponibile qui. Usa il pulsante 🎙 sulla tastiera per dettare.');
      }
    }, 3000);

    recognition.onstart = () => {
      clearStartTimeout();
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

      if (finalTranscript) {
        finalTextRef.current = finalTranscript;
        setTranscript(finalTranscript);
      } else if (interimTranscript) {
        setTranscript(interimTranscript);
      }
    };

    recognition.onend = () => {
      clearStartTimeout();
      if (finalTextRef.current) {
        setTranscript(finalTextRef.current);
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      clearStartTimeout();
      if (event.error === 'aborted') {
        setIsListening(false);
        recognitionRef.current = null;
        return;
      }

      // Permanent failure — disable the button for this session
      if (PERMANENT_ERRORS.has(event.error)) {
        setPermanentlyDisabled(true);
      }

      if (event.error === 'no-speech') {
        setError('Nessun audio rilevato. Riprova parlando più forte.');
      } else {
        setError(STT_ERROR_MESSAGES[event.error] ?? `Errore microfono: ${event.error}`);
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      clearStartTimeout();
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('not allowed') || msg.includes('NotAllowedError')) {
        setPermanentlyDisabled(true);
        setError('Microfono non autorizzato. Usa il pulsante 🎙 sulla tastiera per dettare.');
      } else {
        setPermanentlyDisabled(true);
        setError('Vocale non disponibile. Usa il pulsante 🎙 sulla tastiera per dettare.');
      }
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [SRClass, permanentlyDisabled, clearStartTimeout]);

  useEffect(() => {
    return () => {
      clearStartTimeout();
      recognitionRef.current?.abort();
    };
  }, [clearStartTimeout]);

  return {
    startListening,
    stopListening,
    isListening,
    transcript,
    isSupported,
    error,
    resetTranscript,
  };
}
