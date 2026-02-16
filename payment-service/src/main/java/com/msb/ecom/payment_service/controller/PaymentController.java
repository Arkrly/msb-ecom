package com.msb.ecom.payment_service.controller;

import com.msb.ecom.payment_service.dto.PaymentRequest;
import com.msb.ecom.payment_service.dto.PaymentResponse;
import com.msb.ecom.payment_service.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse processPayment(@RequestBody @Valid PaymentRequest paymentRequest) {
        return paymentService.processPayment(paymentRequest);
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<PaymentResponse> getAllPayments() {
        return paymentService.getAllPayments();
    }

    @GetMapping("/order/{orderNumber}")
    @ResponseStatus(HttpStatus.OK)
    public List<PaymentResponse> getPaymentsByOrder(@PathVariable String orderNumber) {
        return paymentService.getPaymentsByOrderNumber(orderNumber);
    }

    @GetMapping("/transaction/{transactionId}")
    @ResponseStatus(HttpStatus.OK)
    public PaymentResponse getPaymentByTransaction(@PathVariable String transactionId) {
        return paymentService.getPaymentByTransactionId(transactionId);
    }

    @PostMapping("/refund/{transactionId}")
    @ResponseStatus(HttpStatus.OK)
    public PaymentResponse refundPayment(@PathVariable String transactionId) {
        return paymentService.refundPayment(transactionId);
    }
}
