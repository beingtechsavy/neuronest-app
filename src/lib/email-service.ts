import { resend, EMAIL_FROM, isEmailServiceConfigured } from './resend';
import {
  welcomeEmail,
  verificationEmail,
  passwordResetEmail,
  subscriptionConfirmationEmail,
  paymentReceiptEmail,
} from './email-templates';

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Helper to check if email service is available
function checkEmailService(): SendEmailResult | null {
  if (!isEmailServiceConfigured()) {
    console.warn('Email service not configured - RESEND_API_KEY missing');
    return { 
      success: false, 
      error: 'Email service is not configured. Please set RESEND_API_KEY environment variable.' 
    };
  }
  return null;
}

export async function sendWelcomeEmail(
  to: string,
  username: string
): Promise<SendEmailResult> {
  const configCheck = checkEmailService();
  if (configCheck) return configCheck;

  try {
    const template = welcomeEmail(username);
    
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Exception sending welcome email:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendVerificationEmail(
  to: string,
  username: string,
  verificationLink: string
): Promise<SendEmailResult> {
  const configCheck = checkEmailService();
  if (configCheck) return configCheck;

  try {
    const template = verificationEmail(verificationLink, username);
    
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Exception sending verification email:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  username: string,
  resetLink: string
): Promise<SendEmailResult> {
  const configCheck = checkEmailService();
  if (configCheck) return configCheck;

  try {
    const template = passwordResetEmail(resetLink, username);
    
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Exception sending password reset email:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendSubscriptionConfirmationEmail(
  to: string,
  username: string,
  planName: string,
  features: string[],
  nextBillingDate: string,
  amount: string
): Promise<SendEmailResult> {
  const configCheck = checkEmailService();
  if (configCheck) return configCheck;

  try {
    const template = subscriptionConfirmationEmail(
      username,
      planName,
      features,
      nextBillingDate,
      amount
    );
    
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Failed to send subscription confirmation email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Exception sending subscription confirmation email:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendPaymentReceiptEmail(
  to: string,
  username: string,
  planName: string,
  amount: string,
  transactionId: string,
  date: string
): Promise<SendEmailResult> {
  const configCheck = checkEmailService();
  if (configCheck) return configCheck;

  try {
    const template = paymentReceiptEmail(
      username,
      planName,
      amount,
      transactionId,
      date
    );
    
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Failed to send payment receipt email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Exception sending payment receipt email:', error);
    return { success: false, error: String(error) };
  }
}
