package com.assignment.product_api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;

/**
 * A ready-made realistic picture of the mannequin wearing one exact set of
 * products. An admin uploads it; the fitting room shows it when a user picks
 * the same products on the same pose.
 */
@Entity
@Table(
        name = "outfit_look",
        uniqueConstraints = @UniqueConstraint(columnNames = {"productKey", "pose"})
)
public class OutfitLook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Sorted product ids joined by commas, e.g. "58,64"
    @Column(nullable = false, length = 100)
    private String productKey;

    @Column(nullable = false, length = 20)
    private String pose;

    @Column(nullable = false, length = 40)
    private String mimeType;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGBLOB")
    private byte[] image;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public OutfitLook() {
    }

    public OutfitLook(String productKey, String pose, String mimeType, byte[] image) {
        this.productKey = productKey;
        this.pose = pose;
        this.mimeType = mimeType;
        this.image = image;
    }

    public Long getId() {
        return id;
    }

    public String getProductKey() {
        return productKey;
    }

    public String getPose() {
        return pose;
    }

    public String getMimeType() {
        return mimeType;
    }

    public byte[] getImage() {
        return image;
    }

    public void replaceImage(String mimeType, byte[] image) {
        this.mimeType = mimeType;
        this.image = image;
        this.createdAt = LocalDateTime.now();
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
