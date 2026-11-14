package com.orscheduler.service;

import com.orscheduler.dto.request.UserRequest;
import com.orscheduler.dto.response.UserResponse;
import com.orscheduler.entity.User;
import com.orscheduler.entity.UserRoleEntity;
import com.orscheduler.enums.UserRole;
import com.orscheduler.exception.ConflictException;
import com.orscheduler.exception.ResourceNotFoundException;
import com.orscheduler.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return toResponse(user);
    }

    @Transactional
    public UserResponse createUser(UserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username " + request.getUsername() + " is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email " + request.getEmail() + " is already in use");
        }

        User user = User.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(requirePassword(request.getPassword())))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .active(request.isActive())
                .roles(new HashSet<>())
                .build();

        if (request.getRoles() != null) {
            for (UserRole role : request.getRoles()) {
                user.getRoles().add(UserRoleEntity.builder()
                        .user(user)
                        .role(role)
                        .build());
            }
        }

        User saved = userRepository.save(user);
        auditService.logAction("CREATE_USER", "User", saved.getId(), null, saved.getUsername());
        return toResponse(saved);
    }

    private String requirePassword(String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        return password;
    }

    @Transactional
    public UserResponse updateUser(Long id, UserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email " + request.getEmail() + " is already in use");
        }

        String currentUsername = com.orscheduler.security.SecurityUtils.getCurrentUsername().orElse(null);
        boolean isSelf = user.getUsername().equals(currentUsername);
        if (isSelf && (!request.isActive()
                || (request.getRoles() != null && !request.getRoles().contains(UserRole.ADMIN)))) {
            throw new ConflictException("You cannot deactivate your own account or remove your own administrator role");
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setActive(request.isActive());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getRoles() != null) {
            user.getRoles().clear();
            for (UserRole role : request.getRoles()) {
                user.getRoles().add(UserRoleEntity.builder()
                        .user(user)
                        .role(role)
                        .build());
            }
        }

        User updated = userRepository.save(user);
        auditService.logAction("UPDATE_USER", "User", updated.getId(), null, updated.getUsername());
        return toResponse(updated);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        String currentUsername = com.orscheduler.security.SecurityUtils.getCurrentUsername().orElse(null);
        if (user.getUsername().equals(currentUsername)) {
            throw new ConflictException("You cannot deactivate your own account");
        }
        user.setActive(false);
        userRepository.save(user);
        auditService.logAction("DEACTIVATE_USER", "User", user.getId(), null, user.getUsername());
    }

    @Transactional
    public UserResponse updateProfile(String username, String fullName, String email, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        if (email != null && !email.isBlank() && !email.equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                throw new ConflictException("Email " + email + " is already in use");
            }
            user.setEmail(email);
        }

        if (fullName != null && !fullName.isBlank()) {
            user.setFullName(fullName);
        }

        if (password != null && !password.isBlank()) {
            if (password.length() < 6) {
                throw new IllegalArgumentException("Password must be at least 6 characters");
            }
            user.setPasswordHash(passwordEncoder.encode(password));
        }

        User updated = userRepository.save(user);
        auditService.logAction("UPDATE_PROFILE", "User", updated.getId(), null, updated.getUsername());
        return toResponse(updated);
    }

    public UserResponse toResponse(User u) {
        Set<UserRole> roles = u.getRoles() != null ?
                u.getRoles().stream().map(UserRoleEntity::getRole).collect(Collectors.toSet()) :
                Set.of();

        return UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .active(u.isActive())
                .roles(roles)
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }
}
