package com.fullStack.expenseTracker.services.impls;

import com.fullStack.expenseTracker.exceptions.EmailDeliveryException;
import com.fullStack.expenseTracker.models.User;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Locale;

@Component
@Slf4j
@ConditionalOnProperty(name = "app.mail.mode", havingValue = "api")
public class BrevoApiMailService {

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private final String apiKey;
    private final String fromMail;
    private final String senderName;
    private final long codeExpirationMs;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public BrevoApiMailService(
            @Value("${brevo.api.key:}") String apiKey,
            @Value("${app.mail.from:}") String fromMail,
            @Value("${app.mail.sender-name:PocketWise}") String senderName,
            @Value("${spring.mail.username:}") String mailUsername,
            @Value("${app.verificationCodeExpirationMs:900000}") long codeExpirationMs) {

        this.apiKey = apiKey;
        String configuredFrom = isBlank(fromMail) ? mailUsername : fromMail;
        this.fromMail = isBlank(configuredFrom) ? "no-reply@pocketwise.local" : configuredFrom;
        this.senderName = isBlank(senderName) ? "PocketWise" : senderName;
        this.codeExpirationMs = codeExpirationMs;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
        this.objectMapper = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);
    }

    public void sendUserRegistrationVerificationEmail(User user) {
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
        sendEmail(user.getEmail(), subject, content);
    }

    public void sendForgotPasswordVerificationEmail(User user) {
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
        sendEmail(user.getEmail(), subject, content);
    }

    private void sendEmail(String toEmail, String subject, String htmlContent) {
        if (isBlank(apiKey)) {
            throw new EmailDeliveryException("Brevo API key is missing (set BREVO_API_KEY / brevo.api.key).");
        }
        try {
            BrevoEmailRequest request = new BrevoEmailRequest(
                    new Sender(senderName, fromMail),
                    List.of(new Recipient(toEmail)),
                    subject,
                    htmlContent
            );
            String json = objectMapper.writeValueAsString(request);
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_API_URL))
                    .timeout(Duration.ofSeconds(30))
                    .header("accept", "application/json")
                    .header("api-key", apiKey)
                    .header("content-type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Brevo API returned status {}: {}", response.statusCode(), response.body());
                throw new EmailDeliveryException("Failed to send email via Brevo API (status " + response.statusCode() + ")");
            }
            log.debug("Brevo API email sent successfully to {}", toEmail);
        } catch (EmailDeliveryException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error sending email via Brevo API", e);
            throw new EmailDeliveryException("Failed to send email via Brevo API", e);
        }
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

    @JsonInclude(JsonInclude.Include.NON_NULL)
    static class BrevoEmailRequest {
        @JsonProperty("sender")
        public Sender sender;
        @JsonProperty("to")
        public List<Recipient> to;
        @JsonProperty("subject")
        public String subject;
        @JsonProperty("htmlContent")
        public String htmlContent;

        public BrevoEmailRequest(Sender sender, List<Recipient> to, String subject, String htmlContent) {
            this.sender = sender;
            this.to = to;
            this.subject = subject;
            this.htmlContent = htmlContent;
        }
    }

    static class Sender {
        @JsonProperty("name")
        public String name;
        @JsonProperty("email")
        public String email;

        public Sender(String name, String email) {
            this.name = name;
            this.email = email;
        }
    }

    static class Recipient {
        @JsonProperty("email")
        public String email;

        public Recipient(String email) {
            this.email = email;
        }
    }
}
