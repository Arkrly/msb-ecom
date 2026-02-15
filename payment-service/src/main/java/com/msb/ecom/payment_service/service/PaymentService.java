package com.msb.ecom.payment_service.service;

import com.msb.ecom.payment_service.dto.PaymentRequest;
import com.msb.ecom.payment_service.dto.PaymentResponse;
import com.msb.ecom.payment_service.model.Payment;
import com.msb.ecom.payment_service.model.PaymentStatus;
import com.msb.ecom.payment_service.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public PaymentResponse processPayment(PaymentRequest paymentRequest) {
        log.info("Processing payment for order: {}", paymentRequest.orderNumber());

        Payment payment = Payment.builder()
                .orderNumber(paymentRequest.orderNumber())
                .paymentMethod(paymentRequest.paymentMethod())
                .amount(paymentRequest.amount())
                .status(PaymentStatus.COMPLETED)
                .transactionId("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Payment saved = paymentRepository.save(payment);
        log.info("Payment completed: txn={}, order={}", saved.getTransactionId(), saved.getOrderNumber());
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByOrderNumber(String orderNumber) {
        return paymentRepository.findByOrderNumber(orderNumber)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByTransactionId(String transactionId) {
        return paymentRepository.findByTransactionId(transactionId)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + transactionId));
    }

    public PaymentResponse refundPayment(String transactionId) {
        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + transactionId));

        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            throw new RuntimeException("Only completed payments can be refunded");
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        payment.setUpdatedAt(LocalDateTime.now());
        Payment updated = paymentRepository.save(payment);
        log.info("Payment refunded: txn={}", transactionId);
        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private PaymentResponse mapToResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrderNumber(),
                payment.getPaymentMethod(),
                payment.getAmount(),
                payment.getStatus().name(),
                payment.getTransactionId(),
                payment.getCreatedAt());
    }
}
