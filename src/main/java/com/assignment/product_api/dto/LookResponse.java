package com.assignment.product_api.dto;

import java.time.LocalDateTime;
import java.util.List;

/** Details of a saved look (the picture itself is fetched separately). */
public record LookResponse(
        Long id,
        List<Long> productIds,
        String pose,
        LocalDateTime createdAt
) {
}
