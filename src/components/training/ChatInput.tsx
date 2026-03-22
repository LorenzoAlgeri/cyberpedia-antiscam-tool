/**
 * ChatInput — WhatsApp-style free-text input for AI training chat.
 *
 * Uses contentEditable div instead of textarea to prevent iOS Safari
 * from showing the autofill bar (passwords, credit cards, location).
 *
 * - Enter sends, Shift+Enter adds newline
 * - Max 500 characters
 * - Disabled when loading (waiting for AI response)
 * - Touch target: 44px minimum
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  readonly onSend: (text: string) => void;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly maxLength?: number;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Scrivi un messaggio...',
  maxLength = 500,
}: ChatInputProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [canSend, setCanSend] = useState(false);

  // Auto-focus on mount
  useEffect(() => {
    if (!disabled) {
      editorRef.current?.focus({ preventScroll: true });
    }
  }, [disabled]);

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
    // Re-focus after send
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
      // Move cursor to end
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
    <div
      className="flex items-end gap-2 border-t border-slate-700/50 bg-slate-900/60 px-3 py-2"
    >
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
  );
}
