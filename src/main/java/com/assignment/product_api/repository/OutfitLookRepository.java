package com.assignment.product_api.repository;

import com.assignment.product_api.entity.OutfitLook;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OutfitLookRepository extends JpaRepository<OutfitLook, Long> {

    Optional<OutfitLook> findByProductKeyAndPose(String productKey, String pose);
}
