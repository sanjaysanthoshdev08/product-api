package com.assignment.product_api.exception;

import org.springframework.http.HttpStatus;

/** A try-on request that cannot be completed, with the HTTP status to answer with. */
public class TryOnException extends RuntimeException {

    private final HttpStatus status;

    public TryOnException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
