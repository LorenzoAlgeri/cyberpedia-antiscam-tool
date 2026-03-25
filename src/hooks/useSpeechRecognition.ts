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
  // Accumulate final text across results (for continuous = false, usually one result)
  const finalTextRef = useRef('');

  const resetTranscript = useCallback(() => {
    setTranscript('');
    finalTextRef.current = '';
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!SRClass) return;

    // Clear previous state
    setError(null);
    finalTextRef.current = '';

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

      if (finalTranscript) {
        finalTextRef.current = finalTranscript;
        setTranscript(finalTranscript);
      } else if (interimTranscript) {
        setTranscript(interimTranscript);
      }
    };

    recognition.onend = () => {
      // When recognition ends, ensure the final transcript is set
      // (covers edge case where onresult final fires very close to onend)
      if (finalTextRef.current) {
        setTranscript(finalTextRef.current);
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'aborted' is user-initiated, 'no-speech' just means silence
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
    } catch {
      setError('Impossibile avviare il microfono. Controlla i permessi.');
      setIsListening(false);
      recognitionRef.current = null;
    }
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
    error,
    resetTranscript,
  };
}
