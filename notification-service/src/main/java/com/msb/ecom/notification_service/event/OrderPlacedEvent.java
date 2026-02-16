package com.msb.ecom.notification_service.event;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderPlacedEvent {
    @NotBlank(message = "Order number is required")
    private String orderNumber;
    @NotBlank(message = "SkuCode is required")
    private String skuCode;
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
    @Email(message = "Invalid email address")
    private String userEmail;
}
