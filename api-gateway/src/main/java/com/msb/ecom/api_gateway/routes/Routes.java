package com.msb.ecom.api_gateway.routes;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.function.*;

import java.net.URI;

import static org.springframework.cloud.gateway.server.mvc.filter.CircuitBreakerFilterFunctions.circuitBreaker;
import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;

@Configuration(proxyBeanMethods = false)
public class Routes {

        @Value("${service.product.url}")
        private String productServiceUrl;

        @Value("${service.order.url}")
        private String orderServiceUrl;

        @Value("${service.inventory.url}")
        private String inventoryServiceUrl;

        @Value("${service.payment.url}")
        private String paymentServiceUrl;

        @Bean
        public RouterFunction<ServerResponse> productServiceRoute() {
                return route("product_service")
                                .route(RequestPredicates.path("/api/product"), http(productServiceUrl))
                                .filter(circuitBreaker("productServiceCircuitBreaker",
                                                URI.create("forward:/fallbackRoute")))
                                .build();
        }

        @Bean
        public RouterFunction<ServerResponse> orderServiceRoute() {
                return route("order_service")
                                .route(RequestPredicates.path("/api/order"), http(orderServiceUrl))
                                .filter(circuitBreaker("orderServiceCircuitBreaker",
                                                URI.create("forward:/fallbackRoute")))
                                .build();
        }

        @Bean
        public RouterFunction<ServerResponse> inventoryServiceRoute() {
                return route("inventory_service")
                                .route(RequestPredicates.path("/api/inventory"), http(inventoryServiceUrl))
                                .filter(circuitBreaker("inventoryServiceCircuitBreaker",
                                                URI.create("forward:/fallbackRoute")))
                                .build();
        }

        @Bean
        public RouterFunction<ServerResponse> paymentServiceRoute() {
                return route("payment_service")
                                .route(RequestPredicates.path("/api/payment/**"), http(paymentServiceUrl))
                                .filter(circuitBreaker("paymentServiceCircuitBreaker",
                                                URI.create("forward:/fallbackRoute")))
                                .build();
        }

        @Bean
        public RouterFunction<ServerResponse> fallbackRoute() {
                return route("fallbackRoute")
                                .GET("/fallbackRoute", request -> ServerResponse.status(HttpStatus.SERVICE_UNAVAILABLE)
                                                .body("Service is temporarily unavailable. Please try again later."))
                                .POST("/fallbackRoute", request -> ServerResponse.status(HttpStatus.SERVICE_UNAVAILABLE)
                                                .body("Service is temporarily unavailable. Please try again later."))
                                .build();
        }
}
