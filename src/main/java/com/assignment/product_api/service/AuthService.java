package com.assignment.product_api.service;

import com.assignment.product_api.dto.AuthResponse;
import com.assignment.product_api.dto.LoginRequest;
import com.assignment.product_api.dto.RegisterRequest;
import com.assignment.product_api.entity.User;
import com.assignment.product_api.exception.UsernameAlreadyExistsException;
import com.assignment.product_api.repository.UserRepository;
import com.assignment.product_api.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    // REGISTER USER
    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UsernameAlreadyExistsException("Username already exists");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new UsernameAlreadyExistsException("Email already registered");
        }

        User user = new User();
        user.setEmail(email);

        user.setUsername(request.getUsername());

        // Encrypt password before saving
        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        // Every newly registered user gets USER role
        user.setRole("USER");

        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(
                savedUser.getUsername(),
                savedUser.getRole()
        );

        return new AuthResponse(
                token,
                savedUser.getUsername(),
                savedUser.getRole()
        );
    }

    // LOGIN USER
    public AuthResponse login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByUsername(
                request.getUsername()
        ).orElseThrow(() ->
                new RuntimeException("User not found")
        );

        String token = jwtService.generateToken(
                user.getUsername(),
                user.getRole()
        );

        return new AuthResponse(
                token,
                user.getUsername(),
                user.getRole()
        );
    }
}
