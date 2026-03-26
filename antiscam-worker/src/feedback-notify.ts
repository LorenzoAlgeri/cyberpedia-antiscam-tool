/**
 * Notification delivery for feedback submissions.
 *
 * Sends to Telegram (multi-recipient) and email via Resend API.
 * All calls are fire-and-forget — errors are logged but never block the response.
 */

import type { Env } from './types';
import { escapeHtml } from './helpers';
import { logger } from './logger';

// ── Types ────────────────────────────────────────────────────────────────────

interface FeedbackNotifyPayload {
  readonly categoryLabel: string;
  readonly message?: string | undefined;
  readonly contact?: string | undefined;
  readonly screenshots: readonly string[];
  readonly page?: string | undefined;
  readonly userAgent?: string | undefined;
  readonly submittedAt: string;
  readonly ip: string;
}

const NOTIFICATION_EMAILS = ['lorenzo.algeri03@gmail.com', 'davide.algeri@gmail.com'];

// ── Telegram ─────────────────────────────────────────────────────────────────

export function notifyTelegram(env: Env, ctx: ExecutionContext, data: FeedbackNotifyPayload): void {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;

  const msgExcerpt = data.message?.trim()
    ? escapeHtml(data.message.trim().slice(0, 200)) + (data.message.trim().length > 200 ? '...' : '')
    : '<i>Nessun messaggio</i>';

  const text = [
    `\u{1F4AC} <b>Nuovo Feedback</b>`,
    `\u{1F3F7} <b>Categoria:</b> ${escapeHtml(data.categoryLabel)}`,
    `\u{1F4DD} <b>Messaggio:</b> ${msgExcerpt}`,
    data.contact?.trim() ? `\u{1F4E7} <b>Contatto:</b> ${escapeHtml(data.contact.trim())}` : '',
    data.screenshots.length > 0 ? `\u{1F4F7} <b>Screenshot:</b> ${data.screenshots.length}` : '',
    data.page ? `\u{1F4C4} <b>Pagina:</b> ${escapeHtml(data.page)}` : '',
    `\u{1F552} ${data.submittedAt}`,
  ]
    .filter(Boolean)
    .join('\n');

  const chatIds = env.TELEGRAM_CHAT_ID.split(',').map((id) => id.trim()).filter(Boolean);
  ctx.waitUntil(
    Promise.all(
      chatIds.map((chatId) =>
        fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
        }).catch((e) =>
          logger.error('telegram.feedback.failed', {
            chatId,
            error: e instanceof Error ? e.message : String(e),
          }),
        ),
      ),
    ),
  );
}

// ── Email via Resend ─────────────────────────────────────────────────────────

export function notifyResend(env: Env, ctx: ExecutionContext, data: FeedbackNotifyPayload): void {
  if (!env.RESEND_API_KEY) return;

  const attachments = data.screenshots.slice(0, 10).map((raw, i) => {
    const base64 = raw.includes(',') ? raw.split(',')[1] : raw;
    return { filename: `screenshot-${i + 1}.png`, content: base64 };
  });

  const htmlBody = [
    `<h2>Nuovo feedback da Cyberpedia Anti-Truffa</h2>`,
    `<p><strong>Categoria:</strong> ${escapeHtml(data.categoryLabel)}</p>`,
    data.message?.trim()
      ? `<p><strong>Messaggio:</strong><br>${escapeHtml(data.message.trim()).replace(/\n/g, '<br>')}</p>`
      : '',
    data.contact?.trim()
      ? `<p><strong>Contatto:</strong> ${escapeHtml(data.contact.trim())}</p>`
      : '',
    data.screenshots.length > 0
      ? `<p><strong>Screenshot allegati:</strong> ${data.screenshots.length}</p>`
      : '',
    data.page ? `<p><strong>Pagina:</strong> ${escapeHtml(data.page)}</p>` : '',
    data.userAgent ? `<p><strong>Browser:</strong> ${escapeHtml(data.userAgent)}</p>` : '',
    `<hr><p style="color:#888;font-size:12px">${data.submittedAt} &mdash; IP: ${data.ip}</p>`,
  ]
    .filter(Boolean)
    .join('\n');

  ctx.waitUntil(
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Cyberpedia Feedback <onboarding@resend.dev>',
        to: NOTIFICATION_EMAILS,
        subject: `[Cyberpedia Feedback] ${data.categoryLabel}`,
        html: htmlBody,
        ...(attachments.length > 0 ? { attachments } : {}),
      }),
    }).catch((e) =>
      logger.error('resend.feedback.failed', {
        error: e instanceof Error ? e.message : String(e),
      }),
    ),
  );
}
