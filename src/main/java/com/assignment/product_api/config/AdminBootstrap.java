package com.assignment.product_api.config;

import com.assignment.product_api.entity.User;
import com.assignment.product_api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates an ADMIN user at startup when both APP_ADMIN_USERNAME and
 * APP_ADMIN_PASSWORD are set. Does nothing otherwise, and never
 * overwrites an existing user.
 */
@Component
public class AdminBootstrap implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminUsername;
    private final String adminPassword;

    public AdminBootstrap(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.username:}") String adminUsername,
            @Value("${app.admin.password:}") String adminPassword) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {

        if (adminUsername.isBlank() || adminPassword.isBlank()) {
            log.info("Admin bootstrap skipped (APP_ADMIN_USERNAME/APP_ADMIN_PASSWORD not set)");
            return;
        }

        if (userRepository.existsByUsername(adminUsername)) {
            log.info("Admin bootstrap skipped: user '{}' already exists", adminUsername);
            return;
        }

        User admin = new User();
        admin.setUsername(adminUsername);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole("ADMIN");
        userRepository.save(admin);

        log.info("Admin bootstrap: created ADMIN user '{}'", adminUsername);
    }
}
