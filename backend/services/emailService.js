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
 * Generate Responsive HTML Email Template for CRYPTOSCOPE AI Password Reset OTP
 */
function generateOtpEmailHtml({ name, otp }) {
    const displayName = name ? name.trim() : "Analyst";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CRYPTOSCOPE AI — Password Reset OTP</title>
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
                    <span style="font-size: 11px; font-family: monospace; color: #94a3b8; letter-spacing: 1px;">VERIFICATION OTP</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                Password Reset Verification
              </h1>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Hello <strong>${displayName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                We received a request to reset your password for CRYPTOSCOPE AI. Use the 6-digit verification code below to authorize your password reset:
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 25px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 18px 36px; background: rgba(6, 182, 212, 0.1); border: 2px dashed #00f2fe; border-radius: 12px; letter-spacing: 10px; font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; color: #00f2fe; text-align: center; box-shadow: 0 0 25px rgba(6, 182, 212, 0.2);">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Expiration & Security Notices -->
              <div style="background-color: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 16px 20px; margin: 25px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size: 12px; line-height: 1.6; color: #94a3b8;">
                      <strong style="color: #00f2fe;">⚠️ Security Guidelines:</strong><br>
                      &bull; This OTP is valid for exactly <strong>10 minutes</strong>.<br>
                      &bull; If you did not request this password reset, please ignore this email; your account credentials remain safe.<br>
                      &bull; Never share this one-time code with anyone, including CRYPTOSCOPE staff.
                    </td>
                  </tr>
                </table>
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
 * Generate Plaintext Email Fallback for CRYPTOSCOPE AI Password Reset OTP
 */
function generateOtpEmailText({ name, otp }) {
    const displayName = name ? name.trim() : "Analyst";

    return `CRYPTOSCOPE AI — Password Reset OTP

Hello ${displayName},

We received a request to reset the password for your CRYPTOSCOPE AI account.

Your 6-digit Verification OTP:
${otp}

SECURITY NOTICES:
- This OTP expires in exactly 10 minutes.
- If you did not request this password reset, please ignore this email; your account remains secure.
- Never share this one-time passcode with anyone.

--
CRYPTOSCOPE AI Security Team
Blockchain Risk Intelligence & Security Telemetry`;
}

/**
 * Transmit Password Reset OTP Email via Configured Nodemailer SMTP Transport
 */
async function sendPasswordResetOtpEmail({ to, name, otp }) {
    if (!to) {
        console.warn("[EmailService] No recipient address provided for password reset OTP email.");
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
            subject: "CRYPTOSCOPE AI — Password Reset OTP",
            text: generateOtpEmailText({ name, otp }),
            html: generateOtpEmailHtml({ name, otp }),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Password reset OTP email successfully dispatched to recipient.`);

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
    sendPasswordResetOtpEmail,
    verifyEmailConfig,
    isEmailConfigured,
    generateOtpEmailHtml,
    generateOtpEmailText,
};
