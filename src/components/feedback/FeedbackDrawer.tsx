/** FeedbackDrawer — self-contained feedback widget (trigger + drawer).
 * Mobile: bottom-sheet. Desktop (>=640px): right-side panel. Resets form on close. */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { X, Bug, Wrench, Lightbulb, MessageSquare, CheckCircle, Loader2 } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { ScreenshotUpload } from '@/components/dossier/ScreenshotUpload';
import { FeedbackTrigger } from '@/components/feedback/FeedbackTrigger';
import {
  FEEDBACK_CATEGORIES, FEEDBACK_CATEGORY_LABELS,
  MAX_FEEDBACK_MESSAGE, MAX_FEEDBACK_CONTACT, MAX_FEEDBACK_SCREENSHOTS,
} from '@/types/feedback';
import type { FeedbackCategory, FeedbackPayload } from '@/types/feedback';
import type { DossierScreenshot } from '@/types/dossier';
import { useFeedbackAPI } from '@/hooks/useFeedbackAPI';

interface FeedbackDrawerProps { readonly currentPage: string }

const CAT_ICONS: Record<FeedbackCategory, typeof Bug> = {
  bug: Bug, 'fix-suggestion': Wrench, improvement: Lightbulb, general: MessageSquare,
};
const SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 };

export function FeedbackDrawer({ currentPage }: FeedbackDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [screenshots, setScreenshots] = useState<DossierScreenshot[]>([]);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const drawerRef = useRef<HTMLDivElement>(null);
  const { submitFeedback, cancel: cancelFeedback } = useFeedbackAPI();

  const resetForm = useCallback(() => {
    setCategory(null); setMessage(''); setContact(''); setScreenshots([]); setStatus('idle');
  }, []);
  const handleClose = useCallback(() => { cancelFeedback(); setIsOpen(false); resetForm(); }, [cancelFeedback, resetForm]);
  const handleOpen = useCallback(() => {
    setIsDesktop(typeof window !== 'undefined' && window.innerWidth >= 640);
    setIsOpen(true);
  }, []);

  useFocusTrap(drawerRef, isOpen, handleClose);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  const isEmpty = !category && !message.trim() && !contact.trim() && screenshots.length === 0;

  const handleSubmit = async () => {
    setStatus('sending');
    try {
      const payload: FeedbackPayload = {
        ...(category ? { category } : {}),
        ...(message.trim() ? { message: message.trim() } : {}),
        ...(contact.trim() ? { contact: contact.trim() } : {}),
        ...(screenshots.length > 0 ? { screenshots: screenshots.map(s => s.dataUri) } : {}),
        page: currentPage,
        userAgent: navigator.userAgent,
      };
      await submitFeedback(payload);
      setStatus('success');
      setTimeout(() => { setIsOpen(false); resetForm(); }, 3000);
    } catch { setStatus('error'); }
  };

  const handleAddScreenshot = useCallback((s: DossierScreenshot) => {
    setScreenshots(prev => [...prev, s]);
  }, []);
  const handleRemoveScreenshot = useCallback((i: number) => {
    setScreenshots(prev => prev.filter((_, idx) => idx !== i));
  }, []);

  const initial = isDesktop ? { x: '100%' } : { y: '100%' };
  const animate = isDesktop ? { x: 0 } : { y: 0 };
  const panelCls = isDesktop
    ? 'fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col bg-slate-900 shadow-2xl shadow-black/50 border-l border-slate-700/50'
    : 'fixed bottom-0 left-0 z-50 flex w-full max-h-[88dvh] flex-col rounded-t-3xl bg-slate-900 shadow-2xl shadow-black/50 border border-slate-700/50';

  return (
    <>
      {!isOpen && <FeedbackTrigger onClick={handleOpen} />}
      <AnimatePresence>
        {isOpen && (
          <>
            <m.div
              key="fb-backdrop"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} onClick={handleClose} aria-hidden="true"
            />
            <m.div
              ref={drawerRef} key="fb-panel" role="dialog" aria-modal="true" aria-label="Feedback"
              className={panelCls} initial={initial} animate={animate} exit={initial} transition={SPRING}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-4 shrink-0">
                <h2 className="text-lg font-semibold text-foreground">Aiutaci a migliorare</h2>
                <button
                  type="button" onClick={handleClose}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-brand"
                  aria-label="Chiudi feedback"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              {/* Scrollable content */}
              <div className="overflow-y-auto px-5 py-4 flex-1 space-y-5">
                {status === 'success' ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <CheckCircle className="h-12 w-12 text-emerald-400" aria-hidden="true" />
                    <p className="text-lg font-medium text-foreground">
                      Grazie! Il tuo feedback ci aiuta a migliorare.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-base text-muted-foreground">
                      Hai trovato un problema o hai un&apos;idea? Diccelo, ogni segnalazione conta.
                    </p>
                    {/* Category 2x2 grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {FEEDBACK_CATEGORIES.map(cat => {
                        const Icon = CAT_ICONS[cat];
                        const sel = category === cat;
                        return (
                          <button
                            key={cat} type="button" role="radio" aria-checked={sel}
                            onClick={() => setCategory(sel ? null : cat)}
                            className="glass-card flex flex-col items-center gap-1.5 px-3 py-3.5 text-center"
                            style={{ minHeight: 44 }}
                          >
                            <Icon className="h-5 w-5 text-cyan-brand" aria-hidden="true" />
                            <span className="text-sm font-medium text-foreground leading-tight">
                              {FEEDBACK_CATEGORY_LABELS[cat]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {/* Message textarea */}
                    <div>
                      <textarea
                        className="input-glass w-full resize-none" rows={3}
                        maxLength={MAX_FEEDBACK_MESSAGE} value={message}
                        placeholder="Descrivi cosa hai notato... (facoltativo)"
                        onChange={e => setMessage(e.target.value)}
                      />
                      <p className="mt-1 text-right text-xs text-muted-foreground">
                        {message.length}/{MAX_FEEDBACK_MESSAGE}
                      </p>
                    </div>
                    {/* Screenshots */}
                    <ScreenshotUpload
                      screenshots={screenshots} onAdd={handleAddScreenshot}
                      onRemove={handleRemoveScreenshot} maxScreenshots={MAX_FEEDBACK_SCREENSHOTS}
                    />
                    {/* Contact */}
                    <div>
                      <input
                        type="text" className="input-glass w-full" value={contact}
                        maxLength={MAX_FEEDBACK_CONTACT} placeholder="Email o telefono (facoltativo)"
                        onChange={e => setContact(e.target.value)}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Solo se vuoi essere ricontattato</p>
                    </div>
                    {status === 'error' && (
                      <p className="text-sm text-red-400">Invio non riuscito. Riprova tra poco.</p>
                    )}
                    {/* Submit */}
                    <button
                      type="button" disabled={isEmpty || status === 'sending'}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                      style={{ minHeight: 44 }} onClick={() => void handleSubmit()}
                    >
                      {status === 'sending' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                      {status === 'sending' ? 'Invio in corso...' : 'Invia feedback'}
                    </button>
                  </>
                )}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
