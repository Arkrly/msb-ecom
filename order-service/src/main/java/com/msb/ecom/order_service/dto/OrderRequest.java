package com.msb.ecom.order_service.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record OrderRequest(
        @NotBlank(message = "SkuCode is required") String skuCode,
        @NotNull(message = "Price is required") @Positive(message = "Price must be positive") BigDecimal price,
        @NotNull(message = "Quantity is required") @Min(value = 1, message = "Quantity must be at least 1") Integer quantity) {
}
