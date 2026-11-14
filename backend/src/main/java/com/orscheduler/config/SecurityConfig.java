package com.orscheduler.config;

import com.orscheduler.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/h2-console/**",
                                "/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/actuator/health",
                                "/error"
                        ).permitAll()

                        // User management - Admin only
                        .requestMatchers("/api/users/**").hasRole("ADMIN")

                        // Audit logs - Admin and OR Manager
                        .requestMatchers("/api/audit/**").hasAnyRole("ADMIN", "OR_MANAGER")

                        // Room mutations
                        .requestMatchers(HttpMethod.POST, "/api/rooms/**").hasAnyRole("ADMIN", "OR_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/rooms/**").hasAnyRole("ADMIN", "OR_MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/api/rooms/**").hasRole("ADMIN")

                        // Staff mutations
                        .requestMatchers(HttpMethod.POST, "/api/staff/**").hasAnyRole("ADMIN", "OR_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/staff/**").hasAnyRole("ADMIN", "OR_MANAGER")

                        // Equipment mutations
                        .requestMatchers(HttpMethod.POST, "/api/equipment/**").hasAnyRole("ADMIN", "OR_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/equipment/**").hasAnyRole("ADMIN", "OR_MANAGER")

                        // Schedule approval / publication - Admin and OR Manager
                        .requestMatchers("/api/schedules/*/approve").hasAnyRole("ADMIN", "OR_MANAGER")
                        .requestMatchers("/api/schedules/*/publish").hasAnyRole("ADMIN", "OR_MANAGER")
                        .requestMatchers("/api/schedules/*/reject").hasAnyRole("ADMIN", "OR_MANAGER")
                        .requestMatchers("/api/reschedule/*/approve").hasAnyRole("ADMIN", "OR_MANAGER")

                        // Rescheduling and schedule generation
                        .requestMatchers("/api/schedules/generate").hasAnyRole("ADMIN", "OR_MANAGER", "SCHEDULER")
                        .requestMatchers("/api/reschedule/**").hasAnyRole("ADMIN", "OR_MANAGER", "SCHEDULER")

                        // Analytics
                        .requestMatchers("/api/analytics/**").hasAnyRole("ADMIN", "OR_MANAGER", "SCHEDULER")

                        // All other authenticated endpoints
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                writeError(response, 401, "Unauthorized", "Authentication is required to access this resource", request.getRequestURI()))
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                writeError(response, 403, "Forbidden", "You do not have permission to perform this action", request.getRequestURI())))
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private static void writeError(jakarta.servlet.http.HttpServletResponse response, int status, String error,
                                   String message, String path) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String safePath = path == null ? "" : path.replace("\\", "\\\\").replace("\"", "\\\"");
        response.getWriter().write("{\"status\":" + status + ",\"error\":\"" + error + "\",\"message\":\""
                + message + "\",\"timestamp\":\"" + java.time.LocalDateTime.now() + "\",\"path\":\"" + safePath + "\"}");
    }
}
