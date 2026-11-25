package com.assignment.product_api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * A generated "mannequin wearing this outfit" picture. The same outfit on the
 * same pose is looked up by cacheKey, so it never costs a second AI call.
 */
@Entity
@Table(name = "tryon_result")
public class TryOnResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // SHA-256 (hex) of pose + products + model + prompt version
    @Column(nullable = false, unique = true, length = 64)
    private String cacheKey;

    @Column(nullable = false, length = 40)
    private String mimeType;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGBLOB")
    private byte[] image;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public TryOnResult() {
    }

    public TryOnResult(String cacheKey, String mimeType, byte[] image) {
        this.cacheKey = cacheKey;
        this.mimeType = mimeType;
        this.image = image;
    }

    public Long getId() {
        return id;
    }

    public String getCacheKey() {
        return cacheKey;
    }

    public String getMimeType() {
        return mimeType;
    }

    public byte[] getImage() {
        return image;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
