package com.assignment.product_api.controller;

import com.assignment.product_api.dto.TryOnRequest;
import com.assignment.product_api.service.TryOnService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tryon")
public class TryOnController {

    private final TryOnService tryOnService;

    public TryOnController(TryOnService tryOnService) {
        this.tryOnService = tryOnService;
    }

    // Any signed-in user. Answers with the picture itself (image bytes).
    @PostMapping
    public ResponseEntity<byte[]> tryOn(
            @Valid @RequestBody TryOnRequest request,
            Authentication authentication) {

        TryOnService.Result result = tryOnService.generate(
                authentication.getName(), request.getProductIds(), request.getPose());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(result.mimeType()))
                .header("X-Tryon-Cached", String.valueOf(result.cached()))
                .body(result.image());
    }
}
