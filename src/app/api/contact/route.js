import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Helper to escape HTML characters in user inputs
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, message, topic } = body || {};

    // 1. Input validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    const chosenTopic = topic && typeof topic === 'string' ? topic.trim() : 'General Inquiry';

    // 2. Check SMTP credentials
    const smtpUser = process.env.SMTP_USER || 'mbekkous2@gmail.com';
    const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;
    const recipientEmail = process.env.CONTACT_RECEIVER_EMAIL || smtpUser;

    if (!smtpPass) {
      console.error('SMTP configuration missing: SMTP_PASS is not set in environment variables.');
      return NextResponse.json(
        {
          success: false,
          error: 'SMTP configuration is incomplete. Please set SMTP_PASS in .env.local',
        },
        { status: 500 }
      );
    }

    // 3. Create Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const safeName = escapeHtml(trimmedName);
    const safeEmail = escapeHtml(trimmedEmail);
    const safeTopic = escapeHtml(chosenTopic);
    const safeMessage = escapeHtml(trimmedMessage).replace(/\n/g, '<br/>');

    // 4. Compose Email
    const mailOptions = {
      from: `"Portfolio Contact Form" <${smtpUser}>`,
      to: recipientEmail,
      replyTo: trimmedEmail,
      subject: `[Portfolio] New message from ${trimmedName} (${chosenTopic})`,
      text: `New message from your portfolio contact form:\n\nName: ${trimmedName}\nEmail: ${trimmedEmail}\nTopic: ${chosenTopic}\n\nMessage:\n${trimmedMessage}\n`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; text-align: center; }
            .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; }
            .body { padding: 28px 24px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; background: rgba(16, 185, 129, 0.2); color: #34d399; margin-bottom: 20px; border: 1px solid rgba(52, 211, 153, 0.3); }
            .field { margin-bottom: 16px; }
            .field-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 4px; }
            .field-value { font-size: 15px; color: #ffffff; font-weight: 500; }
            .message-box { background: #0f172a; border-radius: 8px; padding: 16px; border: 1px solid rgba(255,255,255,0.06); margin-top: 20px; font-size: 15px; line-height: 1.6; color: #e2e8f0; }
            .footer { padding: 16px 24px; background: #0f172a; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05); }
            .reply-btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ New Portfolio Message</h1>
            </div>
            <div class="body">
              <div class="badge">${safeTopic}</div>
              <div class="field">
                <div class="field-label">Sender Name</div>
                <div class="field-value">${safeName}</div>
              </div>
              <div class="field">
                <div class="field-label">Sender Email</div>
                <div class="field-value"><a href="mailto:${safeEmail}" style="color: #38bdf8; text-decoration: none;">${safeEmail}</a></div>
              </div>
              <div class="field">
                <div class="field-label">Topic / Service</div>
                <div class="field-value">${safeTopic}</div>
              </div>
              <div class="field">
                <div class="field-label">Message</div>
                <div class="message-box">${safeMessage}</div>
              </div>
              <div style="text-align: center;">
                <a href="mailto:${safeEmail}?subject=Re: ${encodeURIComponent(chosenTopic)}" class="reply-btn">Reply to ${safeName}</a>
              </div>
            </div>
            <div class="footer">
              Sent automatically via El Mehdi Bekkous Portfolio Contact Form • ${new Date().toUTCString()}
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // 5. Send Email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('API Error in /api/contact:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send message',
      },
      { status: 500 }
    );
  }
}
