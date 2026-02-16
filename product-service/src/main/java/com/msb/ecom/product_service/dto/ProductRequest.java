package com.msb.ecom.product_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank(message = "Name is required") String name,
        String description,
        @NotNull(message = "Price is required") @Positive(message = "Price must be positive") BigDecimal price) {
}
