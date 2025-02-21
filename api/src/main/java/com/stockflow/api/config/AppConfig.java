package com.stockflow.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.Optional;
import java.util.UUID;

@Configuration
@EnableJpaAuditing
@EnableScheduling
public class AppConfig {
    @Bean
    public AuditorAware<UUID> auditorProvider() {
        // In a real app, this would return the current user's ID
        return () -> Optional.of(UUID.randomUUID());
    }
}