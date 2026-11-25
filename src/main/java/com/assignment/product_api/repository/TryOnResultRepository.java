package com.assignment.product_api.repository;

import com.assignment.product_api.entity.TryOnResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TryOnResultRepository extends JpaRepository<TryOnResult, Long> {

    Optional<TryOnResult> findByCacheKey(String cacheKey);
}
