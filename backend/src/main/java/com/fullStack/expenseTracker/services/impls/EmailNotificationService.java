package com.fullStack.expenseTracker.services.impls;

import com.fullStack.expenseTracker.models.User;
import com.fullStack.expenseTracker.services.NotificationService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.io.UnsupportedEncodingException;
import java.util.Locale;

/**
 * Sends transactional email over SMTP, or writes it to the application log when the application
 * is running without mail credentials (see {@code app.mail.mode}).
 */
@Component
@Slf4j
public class EmailNotificationService implements NotificationService {

    private static final String FALLBACK_FROM = "no-reply@pocketwise.local";

    private final JavaMailSender javaMailSender;
    private final String fromMail;
    private final String senderName;
    private final boolean consoleMode;
    private final long codeExpirationMs;

    public EmailNotificationService(
            JavaMailSender javaMailSender,
            @Value("${app.mail.mode:auto}") String mailMode,
            @Value("${app.mail.from:}") String fromMail,
            @Value("${app.mail.sender-name:PocketWise}") String senderName,
            @Value("${spring.mail.username:}") String mailUsername,
            @Value("${spring.mail.password:}") String mailPassword,
            @Value("${spring.mail.properties.mail.smtp.auth:true}") boolean smtpAuth,
            @Value("${app.verificationCodeExpirationMs:900000}") long codeExpirationMs) {

        this.javaMailSender = javaMailSender;
        this.senderName = senderName;
        this.codeExpirationMs = codeExpirationMs;

        boolean credentialsPresent = !isBlank(mailUsername) && !isBlank(mailPassword);
        boolean canSend = !smtpAuth || credentialsPresent;

        String mode = mailMode == null ? "auto" : mailMode.trim().toLowerCase(Locale.ROOT);
        this.consoleMode = switch (mode) {
            case "console" -> true;
            case "smtp" -> false;
            default -> !canSend;
        };

        String configuredFrom = isBlank(fromMail) ? mailUsername : fromMail;
        this.fromMail = isBlank(configuredFrom) ? FALLBACK_FROM : configuredFrom;

        if (consoleMode) {
            log.warn("Mail mode is 'console': emails will be written to this log instead of being sent. " +
                    "Set MAIL_USERNAME/MAIL_PASSWORD (or MAIL_MODE=smtp) to enable real delivery.");
        } else {
            log.info("Mail mode is 'smtp': sending as '{}' <{}>.", senderName, this.fromMail);
        }
    }

    @Override
    public void sendUserRegistrationVerificationEmail(User user) throws MessagingException, UnsupportedEncodingException {
        String subject = "Verify your PocketWise account";
        String content = """
                <div style="font-family:Arial,Helvetica,sans-serif;color:#1e293b;max-width:520px;margin:0 auto">
                  <h2 style="color:#6366f1;margin-bottom:4px">PocketWise</h2>
                  <p>Hi %s,</p>
                  <p>Thanks for signing up. Enter the code below to verify your email address.</p>
                  <p style="font-size:30px;letter-spacing:8px;font-weight:bold;background:#eef1fb;
                            padding:16px;text-align:center;border-radius:10px;color:#4f46e5">%s</p>
                  <p>This code expires in %d minutes. If you didn't create an account, you can ignore this email.</p>
                  <p style="color:#64748b;font-size:13px">— The PocketWise team</p>
                </div>
                """.formatted(escape(user.getUsername()), escape(user.getVerificationCode()), expirationMinutes());

        deliver(user, subject, content);
    }

    @Override
    public void sendForgotPasswordVerificationEmail(User user) throws MessagingException, UnsupportedEncodingException {
        String subject = "Reset your PocketWise password";
        String content = """
                <div style="font-family:Arial,Helvetica,sans-serif;color:#1e293b;max-width:520px;margin:0 auto">
                  <h2 style="color:#6366f1;margin-bottom:4px">PocketWise</h2>
                  <p>Hi %s,</p>
                  <p>We received a request to reset your password. Enter the code below to continue.</p>
                  <p style="font-size:30px;letter-spacing:8px;font-weight:bold;background:#eef1fb;
                            padding:16px;text-align:center;border-radius:10px;color:#4f46e5">%s</p>
                  <p>This code expires in %d minutes. If you didn't request a reset, no action is needed.</p>
                  <p style="color:#64748b;font-size:13px">— The PocketWise team</p>
                </div>
                """.formatted(escape(user.getUsername()), escape(user.getVerificationCode()), expirationMinutes());

        deliver(user, subject, content);
    }

    private void deliver(User user, String subject, String htmlContent)
            throws MessagingException, UnsupportedEncodingException {

        if (consoleMode) {
            logConsoleEmail(user, subject, htmlContent);
            return;
        }

        MimeMessage message = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
        helper.setFrom(fromMail, senderName);
        helper.setTo(user.getEmail());
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        javaMailSender.send(message);
    }

    private void logConsoleEmail(User user, String subject, String htmlContent) {
        String code = user.getVerificationCode() == null ? "(none)" : user.getVerificationCode();
        log.info("""

                ============================================================
                 DEV MAIL (not sent — SMTP is not configured)
                 To:      {}
                 Subject: {}
                 Code:    {}  (valid for {} minutes)
                ============================================================
                {}""",
                user.getEmail(), subject, code, expirationMinutes(), htmlContent);
    }

    private long expirationMinutes() {
        return Math.max(1, codeExpirationMs / 60_000);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
