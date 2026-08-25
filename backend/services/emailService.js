const nodemailer = require("nodemailer");

/**
 * Check if SMTP credentials are configured in environment
 */
function isEmailConfigured() {
    return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Get configured nodemailer transporter instance
 */
function getTransporter() {
    if (!isEmailConfigured()) {
        return null;
    }

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: true,
        },
    });
}

/**
 * Verify SMTP connection and configuration status without exposing credentials
 */
async function verifyEmailConfig() {
    if (!isEmailConfigured()) {
        return {
            configured: false,
            status: "missing",
            message: "SMTP user or password credentials are not configured in environment.",
        };
    }

    try {
        const transporter = getTransporter();
        await transporter.verify();
        return {
            configured: true,
            status: "connected",
            message: "SMTP transport successfully verified and connected.",
        };
    } catch (err) {
        return {
            configured: true,
            status: "connection_failed",
            message: `SMTP connection failed: ${err.message}`,
        };
    }
}

/**
 * Generate Responsive HTML Email Template for CRYPTOSCOPE AI Password Reset
 */
function generateResetHtml({ name, resetUrl }) {
    const displayName = name ? name.trim() : "Analyst";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CRYPTOSCOPE AI — Password Reset</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050811; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #050811; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #0b1221; border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6); overflow: hidden;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 30px 40px; background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(14, 165, 233, 0.05)); border-bottom: 1px solid rgba(6, 182, 212, 0.2);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="display: inline-block; padding: 8px 12px; border-radius: 10px; background-color: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.4);">
                      <span style="font-size: 18px; line-height: 1;">🛡️</span>
                      <span style="font-size: 14px; font-weight: 800; color: #00f2fe; letter-spacing: 0.5px; margin-left: 6px;">CRYPTOSCOPE AI</span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; font-family: monospace; color: #94a3b8; letter-spacing: 1px;">SECURITY ALERT</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                Password Reset Request
              </h1>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Hello <strong>${displayName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                We received a request to reset the password for your CRYPTOSCOPE AI analyst account. To set a new password, click the button below:
              </p>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00f2fe 0%, #0284c7 100%); color: #050811; text-decoration: none; font-size: 14px; font-weight: 800; border-radius: 10px; box-shadow: 0 4px 20px rgba(6, 182, 212, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                      Reset Your Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiration & Security Notices -->
              <div style="background-color: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 16px 20px; margin: 25px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size: 12px; line-height: 1.6; color: #94a3b8;">
                      <strong style="color: #00f2fe;">⚠️ Critical Security Notices:</strong><br>
                      &bull; This single-use link will expire automatically in <strong>15 minutes</strong>.<br>
                      &bull; If you did not request this password reset, no action is required; your account credentials remain secure.<br>
                      &bull; Never forward or share this link with anyone.
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Fallback Direct URL -->
              <p style="margin: 25px 0 8px 0; font-size: 12px; color: #64748b;">
                If the button above does not work, copy and paste the following URL into your web browser:
              </p>
              <div style="background-color: #050811; border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 8px; padding: 12px; font-family: monospace; font-size: 11px; word-break: break-all; color: #38bdf8;">
                <a href="${resetUrl}" style="color: #38bdf8; text-decoration: none;">${resetUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #080c14; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">
                CRYPTOSCOPE AI &bull; Blockchain Risk Intelligence & Telemetry Engine
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                Automated security notification &bull; Please do not reply to this email
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate Plaintext Email Fallback for CRYPTOSCOPE AI Password Reset
 */
function generateResetText({ name, resetUrl }) {
    const displayName = name ? name.trim() : "Analyst";

    return `CRYPTOSCOPE AI — Password Reset Request

Hello ${displayName},

We received a request to reset the password for your CRYPTOSCOPE AI account.

To choose a new password, open the following link in your browser:
${resetUrl}

SECURITY NOTICES:
- This single-use link expires in 15 minutes.
- If you did not request this password reset, please ignore this email; your account remains secure.
- Do not share this link with anyone.

--
CRYPTOSCOPE AI Security Team
Blockchain Risk Intelligence & Security Telemetry`;
}

/**
 * Transmit Password Reset Email via Configured Nodemailer SMTP Transport
 */
async function sendPasswordResetEmail({ to, name, resetUrl }) {
    if (!to) {
        console.warn("[EmailService] No recipient address provided for password reset email.");
        return { success: false, reason: "MISSING_RECIPIENT" };
    }

    if (!isEmailConfigured()) {
        console.warn("[EmailService] SMTP credentials not configured in environment. Real email delivery skipped.");
        return { success: false, reason: "SMTP_NOT_CONFIGURED" };
    }

    try {
        const transporter = getTransporter();
        const fromAddress = process.env.EMAIL_FROM || `CRYPTOSCOPE AI <${process.env.SMTP_USER}>`;

        const mailOptions = {
            from: fromAddress,
            to,
            subject: "CRYPTOSCOPE AI — Password Reset",
            text: generateResetText({ name, resetUrl }),
            html: generateResetHtml({ name, resetUrl }),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Password reset email successfully dispatched to recipient.`);

        return {
            success: true,
            messageId: info.messageId,
            response: info.response,
        };
    } catch (err) {
        console.error(`[EmailService] SMTP transmission error: ${err.message}`);
        return {
            success: false,
            reason: "SMTP_TRANSMISSION_ERROR",
            error: err.message,
        };
    }
}

module.exports = {
    sendPasswordResetEmail,
    verifyEmailConfig,
    isEmailConfigured,
    generateResetHtml,
    generateResetText,
};
