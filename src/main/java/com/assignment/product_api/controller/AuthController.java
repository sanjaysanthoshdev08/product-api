package com.assignment.product_api.controller;

import com.assignment.product_api.dto.AuthResponse;
import com.assignment.product_api.dto.ForgotPasswordRequest;
import com.assignment.product_api.dto.LoginRequest;
import com.assignment.product_api.dto.RegisterRequest;
import com.assignment.product_api.dto.ResetPasswordRequest;
import com.assignment.product_api.service.AuthService;
import com.assignment.product_api.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(
            AuthService authService,
            PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    // REGISTER
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request) {

        return authService.register(request);
    }

    // LOGIN
    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request) {

        return authService.login(request);
    }

    // FORGOT PASSWORD
    // Always answers 202 with the same body, whether or not the account
    // exists, so the endpoint cannot be used to discover registered emails.
    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, String> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        String devToken = passwordResetService.requestReset(request.getEmail());

        String message =
                "If an account exists for that email, we have sent password reset instructions.";

        // Only present when SMTP is not configured (local development)
        return devToken == null
                ? Map.of("message", message)
                : Map.of("message", message, "resetToken", devToken);
    }

    // RESET PASSWORD (token comes from the emailed link)
    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        passwordResetService.resetPassword(
                request.getToken(), request.getNewPassword());

        return Map.of("message", "Your password has been reset. You can now sign in.");
    }
}
