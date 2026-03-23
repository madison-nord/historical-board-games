package com.ninemensmorris.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * SPA (Single Page Application) configuration for serving the frontend.
 *
 * <p>In production, the Vite build output is placed in {@code src/main/resources/static/}
 * and served by Spring Boot's default static resource handling. This configuration
 * forwards unmatched routes to {@code index.html} so that client-side routing works
 * correctly when the user refreshes or navigates directly to a deep link.</p>
 *
 * <p>Routes excluded from forwarding:</p>
 * <ul>
 *   <li>{@code /api/**} — REST API endpoints</li>
 *   <li>{@code /ws/**} — WebSocket endpoints</li>
 *   <li>Requests for static assets (files with extensions like .js, .css, .svg)</li>
 * </ul>
 */
@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    /**
     * Forwards the root path to {@code index.html}.
     *
     * <p>Spring Boot automatically serves static resources from {@code classpath:/static/},
     * so the built frontend files are served directly. This view controller ensures
     * the root URL loads the SPA entry point.</p>
     *
     * @param registry the view controller registry
     */
    @Override
    public void addViewControllers(@NonNull ViewControllerRegistry registry) {
        // Forward root to index.html (served from static resources)
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}
