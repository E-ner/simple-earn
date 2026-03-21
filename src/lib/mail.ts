import { Resend } from 'resend';

/**
 * Mail Utility for Simple Earn
 * Using Resend (https://resend.com) for reliable clinical-grade email delivery.
 */

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Core function to send an email via Resend.
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Resend Error:', error);
      return { success: false, error };
    }

    console.log('Email sent via Resend: %s', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending email via Resend:', error);
    return { success: false, error };
  }
}

/**
 * Send a verification email to a new user.
 */
export async function sendVerificationEmail(email: string, token: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #00BA63;">Welcome to Simple Earn!</h2>
      <p>Thank you for signing up. Use the code below to verify your email address:</p>
      <div style="margin: 30px 0; text-align: center;">
        <div style="display: inline-block; background: #f0f4f8; border: 2px solid #00BA63; border-radius: 12px; padding: 20px 40px;">
          <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Verification Code</p>
          <span style="font-size: 48px; font-weight: 900; letter-spacing: 0.2em; color: #0f172a; font-family: monospace;">${token}</span>
        </div>
      </div>
      <p style="color: #64748b; font-size: 14px;">Enter this code in the registration form. It expires in <strong>15 minutes</strong>.</p>
      <p style="color: #64748b; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">&copy; 2026 Simple Earn Platform. All rights reserved.</p>
    </div>
  `;

  if (process.env.NODE_ENV === 'development') {
    console.log('--- DEVELOPMENT MODE: VERIFICATION OTP ---');
    console.log(`Code: ${token}`);
    console.log('------------------------------------------');
  }

  return sendEmail({
    to: email,
    subject: 'Your Simple Earn verification code',
    html,
  });
}

/**
 * Send a password reset email.
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/en/reset-password?token=${token}`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #00BA63;">Password Reset Request</h2>
      <p>We received a request to reset your password. Click the button below to proceed. This link will expire in 1 hour.</p>
      <div style="margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #00BA63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">&copy; 2026 Simple Earn Platform. All rights reserved.</p>
    </div>
  `;

  if (process.env.NODE_ENV === 'development') {
    console.log('--- DEVELOPMENT MODE: PASSWORD RESET LINK ---');
    console.log(`URL: ${resetUrl}`);
    console.log('--------------------------------------------');
  }

  return sendEmail({
    to: email,
    subject: 'Reset your Simple Earn password',
    html,
  });
}
