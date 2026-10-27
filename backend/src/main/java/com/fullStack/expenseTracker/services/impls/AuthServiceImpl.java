package com.fullStack.expenseTracker.services.impls;

import com.fullStack.expenseTracker.dto.reponses.ApiResponseDto;
import com.fullStack.expenseTracker.enums.ApiResponseStatus;
import com.fullStack.expenseTracker.dto.requests.ResetPasswordRequestDto;
import com.fullStack.expenseTracker.dto.requests.SignUpRequestDto;
import com.fullStack.expenseTracker.exceptions.*;
import com.fullStack.expenseTracker.factories.RoleFactory;
import com.fullStack.expenseTracker.models.Role;
import com.fullStack.expenseTracker.models.User;
import com.fullStack.expenseTracker.repository.UserRepository;
import com.fullStack.expenseTracker.services.AuthService;
import com.fullStack.expenseTracker.services.NotificationService;
import com.fullStack.expenseTracker.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Component
@Slf4j
public class AuthServiceImpl implements AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    @Autowired
    UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private NotificationService notificationService;

    @Autowired(required = false)
    private EmailNotificationService emailNotificationService;

    @Autowired(required = false)
    private BrevoApiMailService brevoApiMailService;

    @org.springframework.beans.factory.annotation.Value("${app.mail.mode:auto}")
    private String mailMode;

    @Autowired
    RoleFactory roleFactory;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.verificationCodeExpirationMs}")
    private long EXPIRY_PERIOD;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<ApiResponseDto<?>> save(SignUpRequestDto signUpRequestDto)
            throws UserAlreadyExistsException, UserServiceLogicException {
        if (userService.existsByUsername(signUpRequestDto.getUserName())) {
            throw new UserAlreadyExistsException("Registration Failed: username is already taken!");
        }
        if (userService.existsByEmail(signUpRequestDto.getEmail())) {
            throw new UserAlreadyExistsException("Registration Failed: email is already taken!");
        }

        User user;
        try {
            user = createUser(signUpRequestDto);
        } catch (RoleNotFoundException e) {
            log.error("Registration failed: default role is missing: {}", e.getMessage());
            throw new UserServiceLogicException("Registration failed: the default role is not configured.");
        }
        userRepository.save(user);

        try {
            sendRegistrationEmail(user);
        } catch (Exception e) {
            // Roll back the insert so the address is not left blocked by a half-created account.
            log.error("Could not send the verification email to {}: {}", user.getEmail(), e.getMessage(), e);
            throw new EmailDeliveryException(
                    "We could not send the verification email to " + user.getEmail() +
                            ". Check the address and try again.", e);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponseDto<>(
                ApiResponseStatus.SUCCESS, HttpStatus.CREATED, "Verification email has been successfully sent!"
        ));
    }

    @Override
    public ResponseEntity<ApiResponseDto<?>> verifyRegistrationVerification(String code) throws UserVerificationFailedException {
        User user = userRepository.findByVerificationCode(code);

        if (user == null || user.isEnabled() || user.getVerificationCodeExpiryTime() == null) {
            throw new UserVerificationFailedException("Verification failed: invalid verification code!");
        }

        long currentTimeInMs = System.currentTimeMillis();
        long codeExpiryTimeInMillis = user.getVerificationCodeExpiryTime().getTime();

        if (currentTimeInMs > codeExpiryTimeInMillis) {
            throw new UserVerificationFailedException("Verification failed: expired verification code!");
        }

        user.setVerificationCode(null);
        user.setVerificationCodeExpiryTime(null);
        user.setEnabled(true);
        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(new ApiResponseDto<>(
                ApiResponseStatus.SUCCESS, HttpStatus.ACCEPTED, "Verification successful: User account has been successfully created!"
        ));
    }

    @Override
    public ResponseEntity<ApiResponseDto<?>> resendVerificationCode(String email)
            throws UserNotFoundException, UserServiceLogicException, UserVerificationFailedException {

        User user = userService.findByEmail(email);

        if (user.isEnabled()) {
            throw new UserVerificationFailedException(
                    "This email is already verified. You can log in instead.");
        }

        user.setVerificationCode(generateVerificationCode());
        user.setVerificationCodeExpiryTime(calculateCodeExpirationTime());
        userRepository.save(user);

        try {
            sendRegistrationEmail(user);
        } catch (Exception e) {
            log.error("Could not resend the verification email to {}: {}", email, e.getMessage(), e);
            throw new EmailDeliveryException(
                    "We could not send the verification email to " + email + ". Try again in a moment.", e);
        }

        return ResponseEntity.status(HttpStatus.OK).body(new ApiResponseDto<>(
                ApiResponseStatus.SUCCESS, HttpStatus.OK, "Verification email has been resent successfully!"
        ));
    }

    @Override
    public ResponseEntity<ApiResponseDto<?>> verifyEmailAndSendForgotPasswordVerificationEmail(String email) throws UserServiceLogicException, UserNotFoundException {
        if (!userService.existsByEmail(email)) {
            throw new UserNotFoundException("Verification failed: User not found with email " + email + "!");
        }

        User user = userService.findByEmail(email);
        user.setVerificationCode(generateVerificationCode());
        user.setVerificationCodeExpiryTime(calculateCodeExpirationTime());
        userRepository.save(user);

        try {
            sendForgotPasswordEmail(user);
        } catch (Exception e) {
            log.error("Could not send the password reset email to {}: {}", email, e.getMessage(), e);
            throw new EmailDeliveryException(
                    "We could not send the password reset email to " + email + ". Try again in a moment.", e);
        }

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(new ApiResponseDto<>(
                ApiResponseStatus.SUCCESS,
                HttpStatus.ACCEPTED,
                "Verification successful: Email sent successfully!"
        ));
    }

    @Override
    public ResponseEntity<ApiResponseDto<?>> verifyForgotPasswordVerification(String code) throws UserVerificationFailedException, UserServiceLogicException {
        User user = userRepository.findByVerificationCode(code);

        if (user == null || user.getVerificationCodeExpiryTime() == null) {
            throw new UserVerificationFailedException("Verification failed: invalid verification code!");
        }

        long currentTimeInMs = System.currentTimeMillis();
        long codeExpiryTimeInMillis = user.getVerificationCodeExpiryTime().getTime();

        if (currentTimeInMs > codeExpiryTimeInMillis) {
            throw new UserVerificationFailedException("Verification failed: expired verification code!");
        }

        // The code is intentionally kept until the password is actually reset: the reset
        // endpoint requires it, so a valid session cannot be forged from an email address.
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(new ApiResponseDto<>(
                ApiResponseStatus.SUCCESS, HttpStatus.ACCEPTED, "Verification successful: User account has been verified!"
        ));
    }

    @Override
    public ResponseEntity<ApiResponseDto<?>> resetPassword(ResetPasswordRequestDto resetPasswordDto) throws UserNotFoundException, UserServiceLogicException {
        if (!userService.existsByEmail(resetPasswordDto.getEmail())) {
            throw new UserNotFoundException("User not found with email " + resetPasswordDto.getEmail() + "!");
        }

        try {
            User user = userService.findByEmail(resetPasswordDto.getEmail());
            boolean hasCurrentPassword = resetPasswordDto.getCurrentPassword() != null
                    && !resetPasswordDto.getCurrentPassword().isEmpty();

            if (hasCurrentPassword) {
                // Authenticated "change password" flow from the settings page
                if (!passwordEncoder.matches(resetPasswordDto.getCurrentPassword(), user.getPassword())) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponseDto<>(
                            ApiResponseStatus.FAILED,
                            HttpStatus.BAD_REQUEST,
                            "Reset password not successful: current password is incorrect!"
                    ));
                }
            } else {
                // "Forgot password" flow: the emailed code proves ownership of the account
                if (!isValidResetCode(user, resetPasswordDto.getCode())) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponseDto<>(
                            ApiResponseStatus.FAILED,
                            HttpStatus.BAD_REQUEST,
                            "Reset password not successful: the verification code is invalid or has expired!"
                    ));
                }
                user.setVerificationCode(null);
                user.setVerificationCodeExpiryTime(null);
            }

            user.setPassword(passwordEncoder.encode(resetPasswordDto.getNewPassword()));
            userRepository.save(user);

            return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponseDto<>(
                    ApiResponseStatus.SUCCESS,
                    HttpStatus.CREATED,
                    "Reset successful: Password has been successfully reset!"
            ));
        } catch (Exception e) {
            log.error("Resetting password failed: {}", e.getMessage());
            throw new UserServiceLogicException("Failed to reset your password: Try again later!");
        }
    }

    private boolean isValidResetCode(User user, String code) {
        return code != null
                && !code.isBlank()
                && user.getVerificationCode() != null
                && user.getVerificationCode().equals(code)
                && user.getVerificationCodeExpiryTime() != null
                && user.getVerificationCodeExpiryTime().getTime() >= System.currentTimeMillis();
    }

    private User createUser(SignUpRequestDto signUpRequestDto) throws RoleNotFoundException {
        return new User(
                signUpRequestDto.getUserName(),
                signUpRequestDto.getEmail(),
                passwordEncoder.encode(signUpRequestDto.getPassword()),
                generateVerificationCode(),
                calculateCodeExpirationTime(),
                false,
                determineRoles(signUpRequestDto.getRoles())
        );
    }

    private String generateVerificationCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private Date calculateCodeExpirationTime() {
        long currentTimeInMs = System.currentTimeMillis();
        return new Date(currentTimeInMs + EXPIRY_PERIOD);
    }

    private Set<Role> determineRoles(Set<String> strRoles) throws RoleNotFoundException {
        Set<Role> roles = new HashSet<>();

        if (strRoles == null) {
            roles.add(roleFactory.getInstance("user"));
        } else {
            for (String role : strRoles) {
                roles.add(roleFactory.getInstance(role));
            }
        }
        return roles;
    }

    private void sendRegistrationEmail(User user) throws Exception {
        String mode = mailMode == null ? "auto" : mailMode.trim().toLowerCase(java.util.Locale.ROOT);
        if ("api".equals(mode)) {
            if (brevoApiMailService != null) {
                brevoApiMailService.sendUserRegistrationVerificationEmail(user);
                return;
            }
            throw new EmailDeliveryException("Brevo API mail service is not configured.");
        }
        if (emailNotificationService != null && notificationService == null) {
            emailNotificationService.sendUserRegistrationVerificationEmail(user);
            return;
        }
        if (notificationService != null) {
            notificationService.sendUserRegistrationVerificationEmail(user);
            return;
        }
        if (brevoApiMailService != null) {
            brevoApiMailService.sendUserRegistrationVerificationEmail(user);
            return;
        }
        if (emailNotificationService != null) {
            emailNotificationService.sendUserRegistrationVerificationEmail(user);
            return;
        }
        throw new EmailDeliveryException("No mail service configured.");
    }

    private void sendForgotPasswordEmail(User user) throws Exception {
        String mode = mailMode == null ? "auto" : mailMode.trim().toLowerCase(java.util.Locale.ROOT);
        if ("api".equals(mode)) {
            if (brevoApiMailService != null) {
                brevoApiMailService.sendForgotPasswordVerificationEmail(user);
                return;
            }
            throw new EmailDeliveryException("Brevo API mail service is not configured.");
        }
        if (emailNotificationService != null && notificationService == null) {
            emailNotificationService.sendForgotPasswordVerificationEmail(user);
            return;
        }
        if (notificationService != null) {
            notificationService.sendForgotPasswordVerificationEmail(user);
            return;
        }
        if (brevoApiMailService != null) {
            brevoApiMailService.sendForgotPasswordVerificationEmail(user);
            return;
        }
        if (emailNotificationService != null) {
            emailNotificationService.sendForgotPasswordVerificationEmail(user);
            return;
        }
        throw new EmailDeliveryException("No mail service configured.");
    }



}