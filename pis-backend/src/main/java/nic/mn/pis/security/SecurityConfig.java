package nic.mn.pis.security;

import lombok.AllArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@AllArgsConstructor
public class SecurityConfig {

    private JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http.csrf(csrf -> csrf.disable());

        // Enable CORS so browser preflight requests from LAN clients are handled correctly.
        http.cors(Customizer.withDefaults());

        http.authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.PUT, "/api/users/*").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/users/*").authenticated()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/users/**").permitAll()
                .requestMatchers("/api/roles/**").permitAll()
                .requestMatchers("/api/files/**").permitAll()
                .requestMatchers("/api/permit-applications/**").permitAll()
            .requestMatchers("/api/districts").permitAll()
                .requestMatchers("/api/districts/**").permitAll()
            .requestMatchers("/api/subdivisions").permitAll()
                .requestMatchers("/api/subdivisions/**").permitAll()
            .requestMatchers("/api/police-stations").permitAll()
                .requestMatchers("/api/police-stations/**").permitAll()
                .anyRequest().authenticated()
        );

        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
