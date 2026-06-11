import { env } from '../config/env';

/**
 * Sends email through Resend's REST API (free tier: 100/day, 3000/month).
 * If RESEND_API_KEY is not configured, emails are logged to the console so
 * local development works without any signup.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log(`[email:console] to=${to} subject="${subject}"`);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html }),
    });
    if (!res.ok) {
      console.error(`[email] Resend error ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error('[email] send failed', err);
  }
}

export function emailShell(title: string, bodyHtml: string): string {
  return `
  <div style="font-family:Georgia,serif;background:#faf6ee;padding:32px">
    <div style="max-width:560px;margin:0 auto;background:#fffdf7;border:1px solid #e4dcc8;border-radius:12px;overflow:hidden">
      <div style="background:#1e5c46;color:#faf6ee;padding:18px 28px">
        <span style="font-size:20px;font-weight:bold;letter-spacing:.5px">Pulse CRM</span>
      </div>
      <div style="padding:28px">
        <h2 style="margin:0 0 16px;color:#10221b">${title}</h2>
        <div style="color:#33433b;font-size:15px;line-height:1.6">${bodyHtml}</div>
        <p style="margin-top:24px"><a href="${env.CLIENT_URL}" style="background:#f2a91f;color:#10221b;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:bold">Open Pulse CRM</a></p>
      </div>
    </div>
  </div>`;
}
