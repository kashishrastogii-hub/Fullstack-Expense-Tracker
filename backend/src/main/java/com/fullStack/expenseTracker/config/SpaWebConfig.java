package com.fullStack.expenseTracker.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnResource;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;
import java.util.List;

/**
 * Serves the React single-page app from {@code classpath:/static} and falls back to
 * {@code index.html} for client-side routes, so a refresh on /user/dashboard still works.
 * API, actuator, OpenAPI and paths with a file extension are never rewritten.
 *
 * <p>Active whenever the SPA is bundled into the jar (the Docker build does this), so the
 * demo container and production behave the same. Local backend development has no
 * {@code static/index.html} and keeps using the React dev server instead.
 */
@Configuration
@ConditionalOnResource(resources = "classpath:static/index.html")
public class SpaWebConfig implements WebMvcConfigurer {

    private static final List<String> NON_SPA_PREFIXES =
            List.of("api/", "actuator/", "v3/api-docs", "swagger-ui", "error");

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requested = location.createRelative(resourcePath);
                        if (requested.exists() && requested.isReadable()) {
                            return requested;
                        }

                        if (resourcePath.contains(".") || isApiPath(resourcePath)) {
                            return null;
                        }

                        Resource index = new ClassPathResource("static/index.html");
                        return index.exists() ? index : null;
                    }

                    private boolean isApiPath(String path) {
                        return NON_SPA_PREFIXES.stream().anyMatch(path::startsWith);
                    }
                });
    }
}
