package com.msb.ecom.payment_service;

import io.restassured.RestAssured;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.MySQLContainer;

import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PaymentServiceApplicationTests {

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
	void shouldProcessPayment() {
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
				.statusCode(201)
				.body("id", notNullValue())
				.body("orderNumber", equalTo("ORD-001"))
				.body("paymentMethod", equalTo("CREDIT_CARD"))
				.body("amount", equalTo(299.99f))
				.body("status", equalTo("COMPLETED"))
				.body("transactionId", startsWith("TXN-"));
	}

	@Test
	void shouldGetAllPayments() {
		// Create a payment first
		String paymentJson = """
				{
				    "orderNumber": "ORD-002",
				    "paymentMethod": "DEBIT_CARD",
				    "amount": 149.50
				}
				""";

		RestAssured.given()
				.contentType("application/json")
				.body(paymentJson)
				.when()
				.post("/api/payment")
				.then()
				.statusCode(201);

		RestAssured.given()
				.when()
				.get("/api/payment")
				.then()
				.statusCode(200)
				.body("size()", greaterThanOrEqualTo(1));
	}

	@Test
	void shouldGetPaymentsByOrderNumber() {
		String paymentJson = """
				{
				    "orderNumber": "ORD-003",
				    "paymentMethod": "UPI",
				    "amount": 500.00
				}
				""";

		RestAssured.given()
				.contentType("application/json")
				.body(paymentJson)
				.when()
				.post("/api/payment")
				.then()
				.statusCode(201);

		RestAssured.given()
				.when()
				.get("/api/payment/order/ORD-003")
				.then()
				.statusCode(200)
				.body("size()", equalTo(1))
				.body("[0].orderNumber", equalTo("ORD-003"))
				.body("[0].paymentMethod", equalTo("UPI"));
	}

	@Test
	void shouldGetPaymentByTransactionId() {
		String paymentJson = """
				{
				    "orderNumber": "ORD-004",
				    "paymentMethod": "NET_BANKING",
				    "amount": 1250.00
				}
				""";

		String transactionId = RestAssured.given()
				.contentType("application/json")
				.body(paymentJson)
				.when()
				.post("/api/payment")
				.then()
				.statusCode(201)
				.extract()
				.path("transactionId");

		RestAssured.given()
				.when()
				.get("/api/payment/transaction/" + transactionId)
				.then()
				.statusCode(200)
				.body("transactionId", equalTo(transactionId))
				.body("orderNumber", equalTo("ORD-004"));
	}

	@Test
	void shouldRefundPayment() {
		String paymentJson = """
				{
				    "orderNumber": "ORD-005",
				    "paymentMethod": "CREDIT_CARD",
				    "amount": 799.99
				}
				""";

		String transactionId = RestAssured.given()
				.contentType("application/json")
				.body(paymentJson)
				.when()
				.post("/api/payment")
				.then()
				.statusCode(201)
				.body("status", equalTo("COMPLETED"))
				.extract()
				.path("transactionId");

		RestAssured.given()
				.when()
				.post("/api/payment/refund/" + transactionId)
				.then()
				.statusCode(200)
				.body("status", equalTo("REFUNDED"))
				.body("transactionId", equalTo(transactionId));
	}
}
