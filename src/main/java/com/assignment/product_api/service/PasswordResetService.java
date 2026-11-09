package com.assignment.product_api.service;

import com.assignment.product_api.entity.PasswordResetToken;
import com.assignment.product_api.entity.User;
import com.assignment.product_api.exception.InvalidResetTokenException;
import com.assignment.product_api.repository.PasswordResetTokenRepository;
import com.assignment.product_api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class PasswordResetService {

    private static final Logger log =
            LoggerFactory.getLogger(PasswordResetService.class);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final SecureRandom random = new SecureRandom();

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.mail.from}")
    private String mailFrom;

    @Value("${app.password-reset.expiry-minutes}")
    private long expiryMinutes;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            ObjectProvider<JavaMailSender> mailSender) {

        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
    }

    // Silently does nothing for unknown emails so callers cannot tell
    // whether an account exists.
    @Transactional
    // Returns the raw token ONLY when no SMTP server is configured (local
    // development), so the UI can go straight to the reset page. With SMTP
    // configured it always returns null and the token travels by email only.
    public String requestReset(String email) {
        User user = userRepository.findByEmailIgnoreCase(email.trim()).orElse(null);
        if (user == null) {
            return null;
        }

        // One live token per user
        tokenRepository.deleteByUser_Id(user.getId());

        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        tokenRepository.save(new PasswordResetToken(
                hash(token),
                user,
                Instant.now().plus(expiryMinutes, ChronoUnit.MINUTES)));

        String link = frontendUrl + "/?reset-token=" + token;
        boolean emailed = sendEmail(user.getEmail(), link);
        return emailed ? null : (mailSender.getIfAvailable() == null ? token : null);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken stored = tokenRepository.findByTokenHash(hash(token))
                .orElseThrow(() -> new InvalidResetTokenException(
                        "This reset link is invalid or has already been used."));

        if (stored.isExpired()) {
            tokenRepository.delete(stored);
            throw new InvalidResetTokenException(
                    "This reset link has expired. Please request a new one.");
        }

        User user = stored.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Single use
        tokenRepository.deleteByUser_Id(user.getId());
    }

    private boolean sendEmail(String to, String link) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            // No SMTP configured (local development): print the link instead.
            log.warn("SMTP not configured. Password reset link for {}: {}", to, link);
            return false;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(to);
            message.setSubject("Reset your password");
            message.setText("We received a request to reset your password.\n\n"
                    + "Open this link to choose a new one (valid for "
                    + expiryMinutes + " minutes):\n" + link + "\n\n"
                    + "If you did not ask for this, you can ignore this email.");
            sender.send(message);
            return true;
        } catch (Exception e) {
            // Never reveal delivery problems to the caller
            log.error("Failed to send password reset email", e);
            return false;
        }
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
