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

/** Map STT error codes to user-facing Italian messages. */
const STT_ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microfono non autorizzato. Controlla i permessi del browser.',
  'service-not-allowed': 'Riconoscimento vocale non disponibile su questo dispositivo.',
  'audio-capture': 'Microfono non disponibile. Verifica che non sia usato da un\'altra app.',
  'network': 'Errore di rete per il riconoscimento vocale. Verifica la connessione.',
  'language-not-supported': 'Lingua italiana non supportata per il riconoscimento vocale.',
};

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
  /** User-visible error message (null if no error). */
  error: string | null;
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
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTextRef = useRef('');

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
    if (!SRClass) return;

    // Clear previous state
    setError(null);
    finalTextRef.current = '';
    clearStartTimeout();

    // Stop any existing instance
    recognitionRef.current?.abort();

    const recognition = new SRClass();
    recognition.lang = 'it-IT';
    recognition.continuous = false;
    recognition.interimResults = true;

    // Show immediate feedback — set listening optimistically
    setIsListening(true);

    // Safety timeout: if onstart doesn't fire within 3s, the API is broken
    // (common in WebViews, in-app browsers, or PWA on iOS)
    startTimeoutRef.current = setTimeout(() => {
      startTimeoutRef.current = null;
      // If we're still in the "optimistic" listening state but onstart never fired
      if (recognitionRef.current === recognition) {
        recognition.abort();
        recognitionRef.current = null;
        setIsListening(false);
        setError('Riconoscimento vocale non disponibile. Apri la pagina in Chrome o Safari per usare il microfono.');
      }
    }, 3000);

    recognition.onstart = () => {
      clearStartTimeout();
      setIsListening(true); // confirm (redundant but safe)
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
      if (event.error !== 'aborted') {
        if (event.error === 'no-speech') {
          setError('Nessun audio rilevato. Riprova parlando più forte.');
        } else {
          setError(STT_ERROR_MESSAGES[event.error] ?? `Errore microfono: ${event.error}`);
        }
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
      setError(
        msg.includes('not allowed') || msg.includes('NotAllowedError')
          ? 'Microfono non autorizzato. Controlla i permessi del browser.'
          : 'Impossibile avviare il microfono. Apri la pagina in Chrome.',
      );
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [SRClass, clearStartTimeout]);

  // Cleanup on unmount
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
