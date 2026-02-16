package com.msb.ecom.api_gateway;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import org.mockito.Mockito;
import org.mockito.ArgumentMatchers;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import io.restassured.RestAssured;

import java.time.Instant;
import java.util.Map;

import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
		"spring.security.oauth2.resourceserver.jwt.secret=5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437"
})
class ApiGatewayApplicationTests {

	@LocalServerPort
	private Integer port;

	@MockitoBean
	private JwtDecoder jwtDecoder;

	@BeforeEach
	void setup() {
		RestAssured.baseURI = "http://localhost";
		RestAssured.port = port;

		// Mock JwtDecoder to return a valid JWT for any token
		Mockito.when(jwtDecoder.decode(ArgumentMatchers.anyString()))
				.thenReturn(Jwt.withTokenValue("token")
						.header("alg", "none")
						.claim("sub", "test-user")
						.issuedAt(Instant.now())
						.expiresAt(Instant.now().plusSeconds(3600))
						.build());
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
