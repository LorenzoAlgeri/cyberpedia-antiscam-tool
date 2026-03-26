/**
 * ChatInput — WhatsApp-style free-text input for AI training chat.
 *
 * Uses contentEditable div for better mobile UX (no form navigation bar).
 * Note: iOS Safari autofill accessory bar cannot be disabled from web code —
 * it's an OS-level feature. Users can disable it in Settings → Safari → Autofill.
 *
 * - Enter sends, Shift+Enter adds newline
 * - Max 500 characters
 * - Disabled when loading (waiting for AI response)
 * - Touch target: 44px minimum
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';

interface ChatInputProps {
  readonly onSend: (text: string) => void;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly maxLength?: number;
  /** Whether STT is supported in this browser. */
  readonly sttSupported?: boolean;
  /** Whether currently listening for speech. */
  readonly isListening?: boolean;
  /** Start listening callback. */
  readonly onStartListening?: () => void;
  /** Stop listening callback. */
  readonly onStopListening?: () => void;
  /** Text injected externally (e.g. from STT transcript). */
  readonly injectedText?: string;
  /** Called after injectedText has been consumed (set into editor). */
  readonly onInjectedTextConsumed?: () => void;
  /** STT error message to display. */
  readonly sttError?: string | null;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Scrivi un messaggio...',
  maxLength = 500,
  sttSupported = false,
  isListening = false,
  onStartListening,
  onStopListening,
  injectedText,
  onInjectedTextConsumed,
  sttError,
}: ChatInputProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [canSend, setCanSend] = useState(false);
  // Track the last injected value to avoid re-injecting the same text
  const lastInjectedRef = useRef('');

  // Auto-focus on mount
  useEffect(() => {
    if (!disabled) {
      editorRef.current?.focus({ preventScroll: true });
    }
  }, [disabled]);

  // Inject external text (e.g. from STT) into the editor.
  // Only inject when listening STOPS and we have a final transcript.
  useEffect(() => {
    if (!injectedText || !editorRef.current) return;
    // Don't re-inject the same text we already processed
    if (injectedText === lastInjectedRef.current) return;
    // Wait for recognition to finish before injecting final text
    if (isListening) return;

    lastInjectedRef.current = injectedText;
    editorRef.current.textContent = injectedText.slice(0, maxLength);
    // Defer state update to avoid synchronous setState inside effect
    queueMicrotask(() => setCanSend(injectedText.trim().length > 0));
    // Move cursor to end
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
    editorRef.current.focus({ preventScroll: true });
    onInjectedTextConsumed?.();
  }, [injectedText, isListening, maxLength, onInjectedTextConsumed]);

  // Reset lastInjectedRef when transcript is consumed (allows re-injection of same text)
  useEffect(() => {
    if (!injectedText) {
      lastInjectedRef.current = '';
    }
  }, [injectedText]);

  const getText = useCallback((): string => {
    return editorRef.current?.textContent ?? '';
  }, []);

  const clearEditor = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.textContent = '';
      setCanSend(false);
    }
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = getText().trim();
    if (!trimmed || disabled) return;
    onSend(trimmed.slice(0, maxLength));
    clearEditor();
    editorRef.current?.focus({ preventScroll: true });
  }, [getText, clearEditor, disabled, onSend, maxLength]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInput = useCallback(() => {
    const text = getText();
    // Enforce max length
    if (text.length > maxLength && editorRef.current) {
      editorRef.current.textContent = text.slice(0, maxLength);
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    setCanSend(text.trim().length > 0);
  }, [getText, maxLength]);

  return (
    <div className="border-t border-slate-700/50 bg-slate-900/60">
      {/* STT status/error bar */}
      {isListening && (
        <div className="flex items-center justify-center gap-2 bg-red-500/10 px-3 py-1.5 text-sm text-red-300">
          <span className="inline-block size-2 animate-pulse rounded-full bg-red-400" />
          Sto ascoltando... parla ora
        </div>
      )}
      {sttError && !isListening && (
        <div className="px-3 py-1.5 text-center text-sm text-amber-400/80">
          {sttError}
        </div>
      )}
      <div className="flex items-end gap-2 px-3 py-2">
        {/* Mic button for STT (Chrome/Edge only) */}
        {sttSupported && (
          <button
            type="button"
            onClick={() => (isListening ? onStopListening?.() : onStartListening?.())}
            disabled={disabled}
            aria-label={isListening ? 'Ferma dettatura' : 'Dettatura vocale'}
            className={`flex size-11 shrink-0 items-center justify-center rounded-full
                       transition-all active:scale-95
                       disabled:opacity-50 disabled:active:scale-100
                       ${
                         isListening
                           ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50 animate-pulse'
                           : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
                       }`}
          >
            {isListening ? (
              <MicOff className="size-5" aria-hidden="true" />
            ) : (
              <Mic className="size-5" aria-hidden="true" />
            )}
          </button>
        )}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          role="textbox"
          aria-label="Scrivi il tuo messaggio"
          data-placeholder={placeholder}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          className={`min-h-[48px] flex-1 rounded-2xl bg-slate-800/60 px-4 py-3
                     text-slate-100 outline-none
                     focus:ring-2 focus:ring-cyan-400/30
                     ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          style={{
            fontSize: '18px',
            overflowWrap: 'break-word',
            maxHeight: '120px',
            overflowY: 'auto',
            wordBreak: 'break-word',
          }}
          suppressContentEditableWarning
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend || disabled}
          aria-label="Invia messaggio"
          className="flex size-11 shrink-0 items-center justify-center rounded-full
                     bg-cyan-500 text-slate-900 transition-all
                     hover:bg-cyan-400 active:scale-95
                     disabled:bg-slate-700 disabled:text-slate-500 disabled:active:scale-100"
        >
          <Send className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
