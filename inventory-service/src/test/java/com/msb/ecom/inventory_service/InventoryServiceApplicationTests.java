package com.msb.ecom.inventory_service;

import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.MySQLContainer;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class InventoryServiceApplicationTests {

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
    void shouldReturnTrueWhenProductIsInStock() {
        // iphone_15 has 100 units seeded by Flyway
        var response = RestAssured.given()
                .when()
                .get("/api/inventory?skuCode=iphone_15&quantity=1")
                .then()
                .statusCode(200)
                .extract().response().as(Boolean.class);

        assertTrue(response);
    }

    @Test
    void shouldReturnTrueWhenExactQuantityAvailable() {
        // iphone_15 has 100 units
        var response = RestAssured.given()
                .when()
                .get("/api/inventory?skuCode=iphone_15&quantity=100")
                .then()
                .statusCode(200)
                .extract().response().as(Boolean.class);

        assertTrue(response);
    }

    @Test
    void shouldReturnFalseWhenQuantityExceedsStock() {
        // iphone_15 has 100 units, requesting 1000
        var response = RestAssured.given()
                .when()
                .get("/api/inventory?skuCode=iphone_15&quantity=1000")
                .then()
                .statusCode(200)
                .extract().response().as(Boolean.class);

        assertFalse(response);
    }

    @Test
    void shouldReturnFalseWhenProductHasZeroStock() {
        // pixel_9 has 0 units
        var response = RestAssured.given()
                .when()
                .get("/api/inventory?skuCode=pixel_9&quantity=1")
                .then()
                .statusCode(200)
                .extract().response().as(Boolean.class);

        assertFalse(response);
    }

    @Test
    void shouldReturnFalseWhenProductDoesNotExist() {
        var response = RestAssured.given()
                .when()
                .get("/api/inventory?skuCode=nonexistent_product&quantity=1")
                .then()
                .statusCode(200)
                .extract().response().as(Boolean.class);

        assertFalse(response);
    }
}
