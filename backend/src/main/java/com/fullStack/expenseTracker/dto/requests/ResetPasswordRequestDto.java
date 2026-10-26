package com.fullStack.expenseTracker.dto.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ResetPasswordRequestDto {

    @NotNull(message = "Email is required!")
    @Email(message = "Email is not in valid format!")
    private String email;

    /**
     * Required when changing a password from the settings page (authenticated flow).
     * Left empty by the "forgot password" flow, which proves ownership with {@link #code}.
     */
    private String currentPassword;

    /**
     * Verification code emailed by the "forgot password" flow. Required when
     * {@link #currentPassword} is empty, so knowing an email address alone cannot
     * reset the account password.
     */
    private String code;

    @NotBlank(message = "New password is required!")
    @Size(min = 8, message = "New password must have atleast 8 characters!")
    @Size(max = 20, message = "New password can have have atmost 20 characters!")
    private String newPassword;

    public ResetPasswordRequestDto(String email, String currentPassword, String newPassword) {
        this.email = email;
        this.currentPassword = currentPassword;
        this.newPassword = newPassword;
    }

    public ResetPasswordRequestDto(String email, String newPassword) {
        this.email = email;
        this.newPassword = newPassword;
    }
}
