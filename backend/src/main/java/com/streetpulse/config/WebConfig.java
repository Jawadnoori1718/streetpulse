package com.streetpulse.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Allow any localhost port in dev (5173/5174/3000/…) plus 127.0.0.1.
        // For production, add your deployed frontend origin here.
        registry.addMapping("/api/**")
                .allowedOriginPatterns(
                    "http://localhost:*",
                    "http://127.0.0.1:*"
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false);
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
