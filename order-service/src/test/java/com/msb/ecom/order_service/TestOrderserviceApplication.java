package com.msb.ecom.order_service;

import org.springframework.boot.SpringApplication;

public class TestOrderserviceApplication {

	public static void main(String[] args) {
		SpringApplication.from(OrderserviceApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
