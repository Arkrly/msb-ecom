package com.msb.ecom.auth_service.service;

import com.msb.ecom.auth_service.dto.LoginRequest;
import com.msb.ecom.auth_service.dto.SignupRequest;
import com.msb.ecom.auth_service.dto.UserResponse;
import com.msb.ecom.auth_service.model.User;
import com.msb.ecom.auth_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final String SESSION_USER_ID = "USER_ID";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public UserResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already registered: " + request.email());
        }

        User user = User.builder()
                .email(request.email())
                .username(request.username())
                .password(passwordEncoder.encode(request.password()))
                .build();


        User saved = userRepository.save(user);
        log.info("User registered: {}", saved.getEmail());

        String token = jwtService.generateToken(saved.getUsername());
        return toResponse(saved, token);
    }

    public UserResponse login(LoginRequest request) { // Removed HttpSession
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getUsername());
        log.info("User logged in: {}", user.getEmail());

        return toResponse(user, token);
    }



    private UserResponse toResponse(User user, String token) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getCreatedAt(),
                token
        );
    }
}
