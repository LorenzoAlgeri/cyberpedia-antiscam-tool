/**
 * ChatInput — WhatsApp-style free-text input for AI training chat.
 *
 * - Enter sends, Shift+Enter adds newline
 * - Max 500 characters
 * - Disabled when loading (waiting for AI response)
 * - Touch target: 44px minimum
 * - Auto-focus on mount
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
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
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount — use preventScroll to avoid iOS Safari
  // scrolling the whole page when keyboard opens
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus({ preventScroll: true });
    }
  }, [disabled]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <div
      className="flex items-end gap-2 border-t border-slate-700/50 bg-slate-900/60 px-3 py-2"
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, maxLength))}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        autoComplete="off"
        autoCorrect="off"
        data-1p-ignore
        data-lpignore="true"
        aria-label="Scrivi il tuo messaggio"
        className="min-h-[48px] flex-1 resize-none rounded-2xl bg-slate-800/60 px-4 py-3
                   text-slate-100 placeholder-slate-500
                   focus:outline-none focus:ring-2 focus:ring-cyan-400/30
                   disabled:cursor-not-allowed disabled:opacity-50"
        style={{ fontSize: '18px' }}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
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
