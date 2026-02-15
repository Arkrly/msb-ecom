package com.msb.ecom.payment_service.dto;

import java.math.BigDecimal;

public record PaymentRequest(String orderNumber, String paymentMethod, BigDecimal amount) {
}
