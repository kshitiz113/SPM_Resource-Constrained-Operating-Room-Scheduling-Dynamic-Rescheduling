package com.orscheduler.controller;

import com.orscheduler.dto.request.LoginRequest;
import com.orscheduler.dto.response.AuthResponse;
import com.orscheduler.dto.response.UserResponse;
import com.orscheduler.security.JwtTokenProvider;
import com.orscheduler.security.SecurityUtils;
import com.orscheduler.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and token lifecycle endpoints")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserService userService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and receive JWT bearer token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(r -> r.replace("ROLE_", ""))
                .collect(Collectors.toList());

        UserResponse user = userService.getUserByUsername(request.getUsername());

        AuthResponse authResponse = AuthResponse.builder()
                .token(jwt)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationMs() / 1000)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .roles(roles)
                        .build())
                .build();

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new clinical user account (always created with CLINICAL_STAFF access)")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody com.orscheduler.dto.request.RegisterRequest body) {
        // Self-registration never grants elevated privileges; an administrator assigns roles afterwards.
        com.orscheduler.dto.request.UserRequest request = com.orscheduler.dto.request.UserRequest.builder()
                .username(body.getUsername().trim())
                .password(body.getPassword())
                .fullName(body.getFullName().trim())
                .email(body.getEmail().trim())
                .roles(java.util.Set.of(com.orscheduler.enums.UserRole.CLINICAL_STAFF))
                .active(true)
                .build();

        UserResponse user = userService.createUser(request);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        List<String> roles = user.getRoles() != null
                ? user.getRoles().stream().map(Enum::name).collect(Collectors.toList())
                : List.of("CLINICAL_STAFF");

        AuthResponse authResponse = AuthResponse.builder()
                .token(jwt)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationMs() / 1000)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .roles(roles)
                        .build())
                .build();

        return new ResponseEntity<>(authResponse, org.springframework.http.HttpStatus.CREATED);
    }

    @GetMapping("/me")
    @Operation(summary = "Get currently authenticated user details")
    public ResponseEntity<UserResponse> getCurrentUser() {
        String username = SecurityUtils.getCurrentUsername()
                .orElseThrow(() -> new RuntimeException("Unauthenticated"));
        return ResponseEntity.ok(userService.getUserByUsername(username));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<UserResponse> updateProfile(@RequestBody com.orscheduler.dto.request.ProfileUpdateRequest request) {
        String username = SecurityUtils.getCurrentUsername()
                .orElseThrow(() -> new RuntimeException("Unauthenticated"));
        return ResponseEntity.ok(userService.updateProfile(username, request.getFullName(), request.getEmail(), request.getPassword()));
    }
}
