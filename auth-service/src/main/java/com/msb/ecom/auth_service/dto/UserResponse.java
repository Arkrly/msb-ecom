package com.msb.ecom.auth_service.dto;

import java.time.LocalDateTime;

public record UserResponse(Long id, String email, String username, LocalDateTime createdAt, String token) {
}
