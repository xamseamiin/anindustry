/**
 * Email utility for sending contact form messages
 * Uses Resend API for email delivery
 */

import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: { filename: string, content: Buffer | string }[];
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, text, attachments } = options;

  // Use Resend if API key is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      
      const result = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
        attachments: attachments,
      });

      if (result.data) {
        console.log('✅ Email sent successfully via Resend:', result.data.id);
        return true;
      } else if (result.error) {
        console.error('❌ Resend email error:', result.error);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error sending email via Resend:', error);
      return false;
    }
  }

  // If no email service is configured, log the email (for development)
  console.log('⚠️ Email service not configured. Email would be sent:');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Body:', text || html);
  
  // In development, return true to allow testing
  // In production, return false if email wasn't actually sent
  return process.env.NODE_ENV === 'development';
}

/**
 * Send contact form notification email
 */
export async function sendContactFormEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  // Always send to hamsemoalin@gmail.com
  const recipientEmail = 'hamsemoalin@gmail.com';
  
  console.log('📧 Sending contact form email to:', recipientEmail);
  console.log('📧 From:', data.name, `(${data.email})`);
  console.log('📧 Subject:', data.subject);
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3498DB; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #555; }
          .value { margin-top: 5px; padding: 10px; background: white; border-radius: 3px; }
          .message-box { background: white; padding: 15px; border-left: 4px solid #3498DB; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Fariin Cusub oo Xiriirka ah</h2>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Magaca:</div>
              <div class="value">${escapeHtml(data.name)}</div>
            </div>
            <div class="field">
              <div class="label">Email:</div>
              <div class="value">${escapeHtml(data.email)}</div>
            </div>
            <div class="field">
              <div class="label">Mowduuca:</div>
              <div class="value">${escapeHtml(data.subject)}</div>
            </div>
            <div class="field">
              <div class="label">Fariinta:</div>
              <div class="message-box">${escapeHtml(data.message).replace(/\n/g, '<br>')}</div>
            </div>
            <div class="footer">
              <p>Fariintan waxay ka timid contact form-ka Revlo website-ka.</p>
              <p>Jawaab u dir: <a href="mailto:${escapeHtml(data.email)}?subject=Re: ${escapeHtml(data.subject)}">${escapeHtml(data.email)}</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Fariin Cusub oo Xiriirka ah

Magaca: ${data.name}
Email: ${data.email}
Mowduuca: ${data.subject}

Fariinta:
${data.message}

---
Fariintan waxay ka timid contact form-ka Revlo website-ka.
Jawaab u dir: ${data.email}
  `;

  return await sendEmail({
    to: recipientEmail,
    subject: `Fariin Cusub: ${data.subject}`,
    html,
    text,
  });
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

