package com.msb.ecom.order_service;

import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.MySQLContainer;

import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderServiceApplicationTests {

    @ServiceConnection
    static MySQLContainer<?> mySQLContainer = new MySQLContainer<>("mysql:8.3.0");

    @LocalServerPort
    private Integer port;

    @BeforeEach
    void setup() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;
    }

    static {
        mySQLContainer.start();
    }

    @Test
    void shouldPlaceOrder() {
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
                .statusCode(201)
                .body("id", notNullValue())
                .body("orderNumber", notNullValue())
                .body("skuCode", equalTo("iphone_15"))
                .body("price", equalTo(1000))
                .body("quantity", equalTo(1));
    }

    @Test
    void shouldGetAllOrders() {
        // First, place an order
        String orderJson = """
                {
                    "skuCode": "samsung_s24",
                    "price": 999,
                    "quantity": 2
                }
                """;

        RestAssured.given()
                .contentType("application/json")
                .body(orderJson)
                .when()
                .post("/api/order")
                .then()
                .statusCode(201);

        // Then, fetch all orders
        RestAssured.given()
                .contentType("application/json")
                .when()
                .get("/api/order")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1))
                .body("skuCode", hasItem("samsung_s24"));
    }

    @Test
    void shouldReturnOrderWithGeneratedOrderNumber() {
        String orderJson = """
                {
                    "skuCode": "pixel_9",
                    "price": 799,
                    "quantity": 1
                }
                """;

        RestAssured.given()
                .contentType("application/json")
                .body(orderJson)
                .when()
                .post("/api/order")
                .then()
                .statusCode(201)
                .body("orderNumber", notNullValue())
                .body("orderNumber", matchesPattern("[a-f0-9\\-]{36}"));
    }
}
