package com.assignment.product_api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private static final String SECRET_KEY =
            "MyVerySecretKeyForProductApiJwtAuthentication2026";

    private static final long EXPIRATION_TIME =
            1000 * 60 * 60; // 1 hour

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(
                SECRET_KEY.getBytes(StandardCharsets.UTF_8)
        );
    }

    // GENERATE JWT TOKEN
    public String generateToken(String username, String role) {

        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(
                        System.currentTimeMillis() + EXPIRATION_TIME
                ))
                .signWith(getSigningKey())
                .compact();
    }

    // EXTRACT USERNAME
    public String extractUsername(String token) {

        return getClaims(token).getSubject();
    }

    // EXTRACT ROLE
    public String extractRole(String token) {

        return getClaims(token)
                .get("role", String.class);
    }

    // VALIDATE TOKEN
    public boolean isTokenValid(String token) {

        try {
            getClaims(token);
            return true;
        } catch (Exception exception) {
            return false;
        }
    }

    // GET CLAIMS
    private Claims getClaims(String token) {

        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}