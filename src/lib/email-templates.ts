// Email templates with clear structure and visual hierarchy

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Base email wrapper with NeuroNest branding
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 8px;
    }
    .brand {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    }
    .content {
      padding: 32px 24px;
    }
    .button {
      display: inline-block;
      background-color: #6366f1;
      color: #ffffff !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 16px 0;
      text-align: center;
    }
    .button:hover {
      background-color: #4f46e5;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .highlight {
      background-color: #fef3c7;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
      margin: 16px 0;
    }
    h1 { color: #111827; font-size: 24px; margin: 0 0 16px 0; }
    h2 { color: #374151; font-size: 20px; margin: 24px 0 12px 0; }
    p { margin: 12px 0; }
    ul { padding-left: 20px; margin: 12px 0; }
    li { margin: 8px 0; }
    .emoji { font-size: 24px; margin-right: 8px; }
  </style>
</head>
<body>
  <div style="padding: 24px;">
    <div class="container">
      <div class="header">
        <div class="logo">🧠</div>
        <h1 class="brand">NeuroNest</h1>
      </div>
      ${content}
      <div class="footer">
        <p>NeuroNest - AI-powered productivity for professionals</p>
        <p>
          <a href="https://www.neuronest.work" style="color: #6366f1; text-decoration: none;">Visit Dashboard</a> • 
          <a href="https://www.neuronest.work/contact" style="color: #6366f1; text-decoration: none;">Contact Support</a>
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
          If you didn't request this email, you can safely ignore it.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const welcomeEmail = (username: string): EmailTemplate => ({
  subject: '🎉 Welcome to NeuroNest!',
  html: emailWrapper(`
    <div class="content">
      <h1><span class="emoji">👋</span>Hey ${username}, welcome aboard!</h1>
      
      <p>We're excited to have you here! NeuroNest helps professionals break down complex work and stay focused.</p>
      
      <div class="highlight">
        <p style="margin: 0;"><strong>🚀 Quick Start (3 steps):</strong></p>
        <ol style="margin: 8px 0 0 0;">
          <li>Add your first project</li>
          <li>Try the AI breakdown feature</li>
          <li>Schedule your tasks in the calendar</li>
        </ol>
      </div>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://www.neuronest.work/dashboard" class="button">Go to Dashboard →</a>
      </div>
      
      <h2>What makes NeuroNest different?</h2>
      <ul>
        <li><strong>AI Task Breakdown:</strong> Turn overwhelming projects into bite-sized steps</li>
        <li><strong>Visual Progress:</strong> Track your wins across all projects</li>
        <li><strong>Clean Design:</strong> No clutter, just what you need</li>
        <li><strong>Smart Scheduling:</strong> Plan around your energy levels</li>
      </ul>
      
      <p>Need help? Just reply to this email or visit our <a href="https://www.neuronest.work/contact" style="color: #6366f1;">support page</a>.</p>
      
      <p style="margin-top: 24px;">Let's get things done. 🎯</p>
      
      <p style="color: #6b7280; font-style: italic;">
        — The NeuroNest Team
      </p>
    </div>
  `),
  text: `Hey ${username}, welcome aboard!

We're excited to have you here! NeuroNest helps professionals break down complex work and stay focused.

🚀 Quick Start (3 steps):
1. Add your first project
2. Try the AI breakdown feature
3. Schedule your tasks in the calendar

Visit your dashboard: https://www.neuronest.work/dashboard

What makes NeuroNest different?
• AI Task Breakdown: Turn overwhelming projects into bite-sized steps
• Visual Progress: Track your wins across all projects
• Clean Design: No clutter, just what you need
• Smart Scheduling: Plan around your energy levels

Need help? Just reply to this email or visit: https://www.neuronest.work/contact

Let's get things done. 🎯

— The NeuroNest Team`
});

export const verificationEmail = (verificationLink: string, username: string): EmailTemplate => ({
  subject: '✅ Verify your NeuroNest email',
  html: emailWrapper(`
    <div class="content">
      <h1><span class="emoji">✉️</span>Verify your email</h1>
      
      <p>Hey ${username}!</p>
      
      <p>Thanks for signing up for NeuroNest. Let's verify your email address so you can start organizing your tasks.</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verificationLink}" class="button">Verify Email Address</a>
      </div>
      
      <div class="highlight">
        <p style="margin: 0;"><strong>⏰ This link expires in 24 hours</strong></p>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
        Or copy and paste this link into your browser:<br>
        <span style="word-break: break-all;">${verificationLink}</span>
      </p>
    </div>
  `),
  text: `Verify your email

Hey ${username}!

Thanks for signing up for NeuroNest. Let's verify your email address so you can start organizing your tasks.

Click here to verify: ${verificationLink}

⏰ This link expires in 24 hours

— The NeuroNest Team`
});

export const passwordResetEmail = (resetLink: string, username: string): EmailTemplate => ({
  subject: '🔐 Reset your NeuroNest password',
  html: emailWrapper(`
    <div class="content">
      <h1><span class="emoji">🔐</span>Password Reset Request</h1>
      
      <p>Hey ${username},</p>
      
      <p>We received a request to reset your password. No worries, it happens to the best of us!</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </div>
      
      <div class="highlight">
        <p style="margin: 0;"><strong>⏰ This link expires in 1 hour</strong></p>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
        Or copy and paste this link into your browser:<br>
        <span style="word-break: break-all;">${resetLink}</span>
      </p>
      
      <p style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #ef4444;">
        <strong>⚠️ Didn't request this?</strong><br>
        If you didn't ask to reset your password, you can safely ignore this email. Your password won't change.
      </p>
    </div>
  `),
  text: `Password Reset Request

Hey ${username},

We received a request to reset your password. No worries, it happens to the best of us!

Click here to reset: ${resetLink}

⏰ This link expires in 1 hour

⚠️ Didn't request this?
If you didn't ask to reset your password, you can safely ignore this email. Your password won't change.

— The NeuroNest Team`
});

export const subscriptionConfirmationEmail = (
  username: string,
  planName: string,
  features: string[],
  nextBillingDate: string,
  amount: string
): EmailTemplate => ({
  subject: `🎉 Welcome to ${planName}!`,
  html: emailWrapper(`
    <div class="content">
      <h1><span class="emoji">🎉</span>You're now a ${planName}!</h1>
      
      <p>Hey ${username},</p>
      
      <p>Thank you for upgrading! You now have access to all the premium features to supercharge your productivity.</p>
      
      <div class="highlight">
        <p style="margin: 0 0 8px 0;"><strong>✨ What you unlocked:</strong></p>
        <ul style="margin: 0;">
          ${features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://www.neuronest.work/dashboard" class="button">Start Using Premium Features →</a>
      </div>
      
      <h2>📋 Subscription Details</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; color: #6b7280;">Plan</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 600;">${planName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; color: #6b7280;">Amount</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 600;">${amount}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #6b7280;">Next Billing</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 600;">${nextBillingDate}</td>
        </tr>
      </table>
      
      <p style="margin-top: 24px;">You can manage your subscription anytime from your <a href="https://www.neuronest.work/settings" style="color: #6366f1;">settings page</a>.</p>
      
      <p style="color: #6b7280; font-style: italic; margin-top: 24px;">
        Questions? We're here to help! Just reply to this email.
      </p>
    </div>
  `),
  text: `You're now a ${planName}!

Hey ${username},

Thank you for upgrading! You now have access to all the premium features to supercharge your productivity.

✨ What you unlocked:
${features.map(f => `• ${f}`).join('\n')}

📋 Subscription Details:
Plan: ${planName}
Amount: ${amount}
Next Billing: ${nextBillingDate}

Start using premium features: https://www.neuronest.work/dashboard

You can manage your subscription anytime from: https://www.neuronest.work/settings

Questions? We're here to help! Just reply to this email.

— The NeuroNest Team`
});

export const paymentReceiptEmail = (
  username: string,
  planName: string,
  amount: string,
  transactionId: string,
  date: string
): EmailTemplate => ({
  subject: `💳 Payment Receipt - ${planName}`,
  html: emailWrapper(`
    <div class="content">
      <h1><span class="emoji">💳</span>Payment Received</h1>
      
      <p>Hey ${username},</p>
      
      <p>Thanks for your payment! Here's your receipt for your records.</p>
      
      <h2>📄 Receipt Details</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 16px; color: #6b7280;">Date</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 600;">${date}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 16px; color: #6b7280;">Plan</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 600;">${planName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 16px; color: #6b7280;">Amount</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #059669;">${amount}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #6b7280;">Transaction ID</td>
          <td style="padding: 12px 16px; text-align: right; font-family: monospace; font-size: 12px;">${transactionId}</td>
        </tr>
      </table>
      
      <p style="margin-top: 24px;">Your subscription is active and all premium features are available.</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://www.neuronest.work/dashboard" class="button">Go to Dashboard</a>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
        Need a formal invoice? Contact us at support@neuronest.work
      </p>
    </div>
  `),
  text: `Payment Received

Hey ${username},

Thanks for your payment! Here's your receipt for your records.

📄 Receipt Details:
Date: ${date}
Plan: ${planName}
Amount: ${amount}
Transaction ID: ${transactionId}

Your subscription is active and all premium features are available.

Visit dashboard: https://www.neuronest.work/dashboard

Need a formal invoice? Contact us at support@neuronest.work

— The NeuroNest Team`
});
