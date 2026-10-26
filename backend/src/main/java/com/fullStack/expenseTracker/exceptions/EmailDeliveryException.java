package com.fullStack.expenseTracker.exceptions;

/**
 * Thrown when a transactional email (verification code, password reset) could not be delivered.
 * Mapped to 502 so the client can show a meaningful message instead of a generic server error.
 */
public class EmailDeliveryException extends RuntimeException {

    public EmailDeliveryException(String message) {
        super(message);
    }

    public EmailDeliveryException(String message, Throwable cause) {
        super(message, cause);
    }
}
