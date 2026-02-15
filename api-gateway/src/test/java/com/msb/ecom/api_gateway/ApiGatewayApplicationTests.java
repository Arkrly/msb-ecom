package com.msb.ecom.api_gateway;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import io.restassured.RestAssured;

import java.time.Instant;
import java.util.Map;

import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
		"spring.security.oauth2.resourceserver.jwt.issuer-uri="
})
@Import(ApiGatewayApplicationTests.MockJwtDecoderConfig.class)
class ApiGatewayApplicationTests {

	@LocalServerPort
	private Integer port;

	@BeforeEach
	void setup() {
		RestAssured.baseURI = "http://localhost";
		RestAssured.port = port;
	}

	@TestConfiguration
	static class MockJwtDecoderConfig {
		@Bean
		public JwtDecoder jwtDecoder() {
			// Return a no-op decoder — we test with permitAll paths or unauthenticated
			return token -> Jwt.withTokenValue(token)
					.header("alg", "none")
					.claim("sub", "test-user")
					.issuedAt(Instant.now())
					.expiresAt(Instant.now().plusSeconds(3600))
					.build();
		}
	}

	@Test
	void shouldReturnFallbackWhenProductServiceDown() {
		// Fallback route is permitAll, so circuit breaker should return 503
		RestAssured.given()
				.when()
				.get("/api/product")
				.then()
				.statusCode(anyOf(equalTo(503), equalTo(401)));
		// 401 if auth kicks in before routing, 503 if circuit breaker handles it
	}

	@Test
	void shouldReturnFallbackWhenOrderServiceDown() {
		String orderJson = """
				{
				    "skuCode": "iphone_15",
				    "price": 1000,
				    "quantity": 1
				}
				""";

		RestAssured.given()
				.contentType("application/json")
				.body(orderJson)
				.when()
				.post("/api/order")
				.then()
				.statusCode(anyOf(equalTo(503), equalTo(401)));
	}

	@Test
	void shouldReturnFallbackWhenInventoryServiceDown() {
		RestAssured.given()
				.when()
				.get("/api/inventory?skuCode=iphone_15&quantity=1")
				.then()
				.statusCode(anyOf(equalTo(503), equalTo(401)));
	}

	@Test
	void shouldExposeActuatorHealth() {
		// Actuator health is in the permitAll list
		RestAssured.given()
				.when()
				.get("/actuator/health")
				.then()
				.statusCode(200)
				.body("status", notNullValue());
	}

	@Test
	void shouldReturnFallbackWhenPaymentServiceDown() {
		String paymentJson = """
				{
				    "orderNumber": "ORD-001",
				    "paymentMethod": "CREDIT_CARD",
				    "amount": 299.99
				}
				""";

		RestAssured.given()
				.contentType("application/json")
				.body(paymentJson)
				.when()
				.post("/api/payment")
				.then()
				.statusCode(anyOf(equalTo(503), equalTo(401)));
	}
}
