/**
 * Email sending utility for hotel management system
 * Supports multiple email services: Resend, SendGrid, Firebase Functions
 */

export async function sendInviteEmail(
  email: string,
  inviteLink: string,
  businessName: string,
  role: string
): Promise<boolean> {
  try {
    const emailService = process.env.EMAIL_SERVICE || 'none';

    if (emailService === 'resend') {
      return await sendViaResend(email, inviteLink, businessName, role);
    } else if (emailService === 'sendgrid') {
      return await sendViaSendGrid(email, inviteLink, businessName, role);
    } else if (emailService === 'firebase') {
      return await sendViaFirebaseFunction(email, inviteLink, businessName, role);
    } else {
      console.warn('Email service not configured. Invite link:', inviteLink);
      return true;
    }
  } catch (error) {
    console.error('Error sending invite email:', error);
    return false;
  }
}

async function sendViaResend(
  email: string,
  inviteLink: string,
  businessName: string,
  role: string
): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY not configured');
      return true;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'noreply@talkserve.ai',
        to: email,
        subject: `You're invited to ${businessName} on TalkServe`,
        html: generateInviteEmailHTML(inviteLink, businessName, role),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending via Resend:', error);
    return false;
  }
}

async function sendViaSendGrid(
  email: string,
  inviteLink: string,
  businessName: string,
  role: string
): Promise<boolean> {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn('SENDGRID_API_KEY not configured');
      return true;
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: process.env.EMAIL_FROM || 'noreply@talkserve.ai' },
        subject: `You're invited to ${businessName} on TalkServe`,
        html_content: generateInviteEmailHTML(inviteLink, businessName, role),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending via SendGrid:', error);
    return false;
  }
}

async function sendViaFirebaseFunction(
  email: string,
  inviteLink: string,
  businessName: string,
  role: string
): Promise<boolean> {
  try {
    const functionUrl = process.env.FIREBASE_FUNCTION_URL;
    if (!functionUrl) {
      console.warn('FIREBASE_FUNCTION_URL not configured');
      return true;
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'send-invite-email',
        email,
        inviteLink,
        businessName,
        role,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending via Firebase Function:', error);
    return false;
  }
}

function generateInviteEmailHTML(
  inviteLink: string,
  businessName: string,
  role: string
): string {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563EB 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .highlight { background: #dbeafe; padding: 15px; border-left: 4px solid #2563EB; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Welcome to TalkServe!</h1>
          <p style="margin: 10px 0 0 0;">You've been invited to join ${businessName}</p>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p>You've been invited to join <strong>${businessName}</strong> as a <strong>${roleLabel}</strong> on the TalkServe AI hotel management system.</p>
          <div class="highlight">
            <p><strong>What to expect:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Manage guest requests and service tickets</li>
              <li>Coordinate with your team across departments</li>
              <li>Track performance and metrics</li>
            </ul>
          </div>
          <p>Click the button below to accept the invitation and create your account:</p>
          <a href="${inviteLink}" class="button">Accept Invitation</a>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link in your browser:<br>
            <code style="background: #f3f4f6; padding: 10px; word-break: break-all;">${inviteLink}</code>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This invitation will expire in 7 days.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TalkServe AI. All rights reserved.</p>
          <p>If you did not expect this invitation, please disregard this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export { generateInviteEmailHTML };
