package com.fullStack.expenseTracker.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.Locale;
import java.util.Set;

/**
 * Guards the production profile against silently broken configuration.
 * Development is intentionally allowed to run with console mail and a default JWT secret.
 */
@Configuration
@Profile("prod")
@Slf4j
public class ProductionConfigValidator {

    private static final String DEFAULT_JWT_SECRET = "expense=tracker=pocketwise";

    /** Secrets shipped in docker-compose files; they are public and must never reach production. */
    private static final Set<String> LOCAL_DEMO_SECRETS = Set.of(
            DEFAULT_JWT_SECRET,
            "local-docker-secret-change-me-0123456789abcdef",
            "MyynTIuydhO7wq+kP38tmGEf0dxawxCURkVc36dfqFjuRVW7+BwYc8lR00QkaA3l");

    @Value("${app.jwtSecret:}")
    private String jwtSecret;

    @Value("${app.mail.mode:auto}")
    private String mailMode;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private boolean smtpAuth;

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @PostConstruct
    void validate() {
        boolean mailConfigured = !smtpAuth
                || (!isBlank(mailUsername) && !isBlank(mailPassword));
        String mode = mailMode == null ? "auto" : mailMode.trim().toLowerCase(Locale.ROOT);

        if (!"auto".equals(mode) && !"console".equals(mode) && !"smtp".equals(mode) && !"api".equals(mode)) {
            fail("MAIL_MODE must be one of auto, console, smtp or api (got '" + mailMode + "').");
        }
        if ("console".equals(mode)) {
            fail("MAIL_MODE=console is not allowed in production: verification emails would never be delivered. " +
                    "Configure an SMTP provider and use MAIL_MODE=smtp (or auto).");
        }
        if ("api".equals(mode)) {
            if (isBlank(brevoApiKey)) {
                fail("MAIL_MODE=api requires BREVO_API_KEY to be set.");
            }
        } else if (!"console".equals(mode) && !mailConfigured) {
            fail("Production requires SMTP credentials: set MAIL_USERNAME and MAIL_PASSWORD, or disable " +
                    "authentication with MAIL_SMTP_AUTH=false when using a relay without authentication.");
        }
        if (jwtSecret == null || jwtSecret.isBlank()
                || jwtSecret.contains(DEFAULT_JWT_SECRET)
                || LOCAL_DEMO_SECRETS.contains(jwtSecret.trim())
                || jwtSecret.trim().length() < 32) {
            fail("JWT_SECRET is missing, too short, or still the local demo default. " +
                    "Generate one with: openssl rand -base64 48 (or use a passphrase of at least 32 characters).");
        }

        if ("api".equals(mode)) {
            log.info("Production configuration validated (mail mode: api).");
        } else {
            log.info("Production configuration validated (mail mode: {}, SMTP auth: {}).",
                    mode, smtpAuth ? "enabled" : "disabled");
        }
    }

    private void fail(String message) {
        log.error("Invalid production configuration: {}", message);
        throw new IllegalStateException(message);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
