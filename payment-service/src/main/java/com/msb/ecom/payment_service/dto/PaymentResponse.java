package com.msb.ecom.payment_service.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        String orderNumber,
        String paymentMethod,
        BigDecimal amount,
        String status,
        String transactionId,
        LocalDateTime createdAt) {
}
