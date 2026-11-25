package com.assignment.product_api.service;

import com.assignment.product_api.dto.ProductRequest;
import com.assignment.product_api.dto.ProductResponse;
import com.assignment.product_api.entity.Product;
import com.assignment.product_api.exception.ProductNotFoundException;
import com.assignment.product_api.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // CREATE PRODUCT
    public ProductResponse createProduct(ProductRequest request) {

        Product product = new Product();
        apply(product, request);

        return toResponse(productRepository.save(product));
    }

    // GET ALL PRODUCTS WITH PAGINATION
    public Page<ProductResponse> getAllProducts(Pageable pageable) {

        return productRepository.findAll(pageable).map(this::toResponse);
    }

    // GET PRODUCT BY ID
    public ProductResponse getProductById(Long id) {

        return toResponse(findOrThrow(id));
    }

    // UPDATE PRODUCT
    public ProductResponse updateProduct(Long id, ProductRequest request) {

        Product product = findOrThrow(id);
        apply(product, request);

        return toResponse(productRepository.save(product));
    }

    // DELETE PRODUCT
    public void deleteProduct(Long id) {

        productRepository.delete(findOrThrow(id));
    }

    private Product findOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(
                        "Product not found with id: " + id
                ));
    }

    private void apply(Product product, ProductRequest request) {
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setQuantity(request.getQuantity());
        product.setCategory(blankToNull(request.getCategory()));
        product.setColors(blankToNull(request.getColors()));
        product.setSizes(blankToNull(request.getSizes()));
        product.setImageKey(blankToNull(request.getImageKey()));
        if (request.getImageUrl() != null) {
            product.setImageUrl(blankToNull(request.getImageUrl()));
        }
        // Keep the existing link when the form does not send one
        if (request.getProductUrl() != null) {
            product.setProductUrl(blankToNull(request.getProductUrl()));
        }
    }

    private ProductResponse toResponse(Product product) {
        ProductResponse response = new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getQuantity(),
                product.getCategory(),
                product.getColors(),
                product.getSizes(),
                product.getImageKey()
        );
        response.setProductUrl(product.getProductUrl());
        response.setImageUrl(product.getImageUrl());
        return response;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
