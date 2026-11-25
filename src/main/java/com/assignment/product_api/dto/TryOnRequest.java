package com.assignment.product_api.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public class TryOnRequest {

    @NotEmpty(message = "Choose at least one product")
    @Size(max = 4, message = "At most 4 products")
    private List<Long> productIds;

    // Which mannequin pose to dress: "crossed", "hips" or "angle"
    private String pose = "crossed";

    public TryOnRequest() {
    }

    public List<Long> getProductIds() {
        return productIds;
    }

    public void setProductIds(List<Long> productIds) {
        this.productIds = productIds;
    }

    public String getPose() {
        return pose;
    }

    public void setPose(String pose) {
        this.pose = pose;
    }
}
