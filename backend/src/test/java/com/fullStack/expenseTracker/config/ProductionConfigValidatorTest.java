package com.fullStack.expenseTracker.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProductionConfigValidatorTest {

    private static final String STRONG_SECRET =
            "wWvHguaeVXwSH6wCUhLkG/mY/o/BDpyhpWVSZYJrAX2ngesbBWTJhm2hbLWni8AN";

    private static ProductionConfigValidator validator(String jwtSecret, String mailMode,
                                                       boolean smtpAuth, String username, String password) {
        ProductionConfigValidator validator = new ProductionConfigValidator();
        ReflectionTestUtils.setField(validator, "jwtSecret", jwtSecret);
        ReflectionTestUtils.setField(validator, "mailMode", mailMode);
        ReflectionTestUtils.setField(validator, "smtpAuth", smtpAuth);
        ReflectionTestUtils.setField(validator, "mailUsername", username);
        ReflectionTestUtils.setField(validator, "mailPassword", password);
        return validator;
    }

    @Test
    void acceptsStrongSecretWithAuthenticatedSmtp() {
        assertDoesNotThrow(() -> validator(STRONG_SECRET, "smtp", true, "user", "key").validate());
    }

    @Test
    void acceptsStrongSecretWithUnauthenticatedRelay() {
        assertDoesNotThrow(() -> validator(STRONG_SECRET, "smtp", false, null, null).validate());
    }

    @Test
    void rejectsConsoleMailMode() {
        assertThrows(IllegalStateException.class,
                () -> validator(STRONG_SECRET, "console", false, null, null).validate());
    }

    @Test
    void rejectsUnknownMailMode() {
        assertThrows(IllegalStateException.class,
                () -> validator(STRONG_SECRET, "carrier-pigeon", false, null, null).validate());
    }

    @Test
    void rejectsSmtpWithoutCredentials() {
        assertThrows(IllegalStateException.class,
                () -> validator(STRONG_SECRET, "smtp", true, "", "").validate());
    }

    @Test
    void rejectsApplicationPropertiesDefaultSecret() {
        String defaultSecret = "======================expense=tracker=pocketwise===========================";

        assertThrows(IllegalStateException.class,
                () -> validator(defaultSecret, "smtp", false, null, null).validate());
    }

    @Test
    void rejectsComposeDemoSecret() {
        assertThrows(IllegalStateException.class,
                () -> validator("MyynTIuydhO7wq+kP38tmGEf0dxawxCURkVc36dfqFjuRVW7+BwYc8lR00QkaA3l",
                        "smtp", false, null, null).validate());
    }

    @Test
    void rejectsShortSecret() {
        assertThrows(IllegalStateException.class,
                () -> validator("too-short", "smtp", false, null, null).validate());
    }
}
