package com.fullStack.expenseTracker.security.jwt;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtUtilsTest {

    @Test
    void decodesBase64Secret() {
        String base64 = "MyynTIuydhO7wq+kP38tmGEf0dxawxCURkVc36dfqFjuRVW7+BwYc8lR00QkaA3l";

        assertEquals(48, JwtUtils.secretBytes(base64).length);
    }

    @Test
    void usesPassphraseBytesWhenNotBase64() {
        // The old implementation decoded every secret as Base64, so a '-' made every login fail.
        String passphrase = "local-docker-secret-change-me-0123456789abcdef";

        assertArrayEquals(passphrase.getBytes(StandardCharsets.UTF_8), JwtUtils.secretBytes(passphrase));
    }

    @Test
    void rejectsBlankSecret() {
        assertThrows(IllegalStateException.class, () -> JwtUtils.secretBytes("   "));
    }
}
