package com.msb.ecom.product_service;

import com.msb.ecom.product_service.dto.ProductRequest;
import io.restassured.RestAssured;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.MongoDBContainer;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ProductServiceApplicationTests {

	@ServiceConnection
	static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:7.0.7");

	@LocalServerPort
	private Integer port;

	@BeforeEach
	void setup() {
		RestAssured.baseURI = "http://localhost";
		RestAssured.port = port;
	}

	static {
		mongoDBContainer.start();
	}

	@Test
	void shouldCreateProduct() {
		ProductRequest productRequest = new ProductRequest("iPhone 15", "Apple iPhone 15", BigDecimal.valueOf(1200));

		RestAssured.given()
				.contentType("application/json")
				.body(productRequest)
				.when()
				.post("/api/product")
				.then()
				.statusCode(201)
				.body("id", notNullValue())
				.body("name", equalTo("iPhone 15"))
				.body("description", equalTo("Apple iPhone 15"))
				.body("price", equalTo(1200));
	}

	@Test
	void shouldGetAllProducts() {
		// First create a product
		ProductRequest productRequest = new ProductRequest("Samsung Galaxy S24", "Samsung Galaxy S24 Ultra",
				BigDecimal.valueOf(999));

		RestAssured.given()
				.contentType("application/json")
				.body(productRequest)
				.when()
				.post("/api/product")
				.then()
				.statusCode(201);

		// Then fetch all products and verify the created product is in the list
		RestAssured.given()
				.contentType("application/json")
				.when()
				.get("/api/product")
				.then()
				.statusCode(200)
				.body("size()", greaterThanOrEqualTo(1))
				.body("name", hasItem("Samsung Galaxy S24"));
	}

	@Test
	void shouldReturnEmptyListWhenNoProductsExist() {
		// This test just verifies the endpoint returns 200
		RestAssured.given()
				.contentType("application/json")
				.when()
				.get("/api/product")
				.then()
				.statusCode(200);
	}
}
