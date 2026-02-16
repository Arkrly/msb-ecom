package com.msb.ecom.payment_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record PaymentRequest(
        @NotBlank(message = "Order number is required") String orderNumber,
        @NotBlank(message = "Payment method is required") String paymentMethod,
        @NotNull(message = "Amount is required") @Positive(message = "Amount must be positive") BigDecimal amount) {
}
